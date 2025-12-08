import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

/**
 * Service for managing WebAuthn passkeys
 */
@Injectable()
export class PasskeyService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  // In-memory challenge storage (use Redis in production)
  private challengeStore = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.rpName = this.config.get('WEBAUTHN_RP_NAME') || 'PingTO.Me';
    this.rpID = this.config.get('WEBAUTHN_RP_ID') || 'localhost';
    this.origin = this.config.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3010';
  }

  /**
   * Generate registration options for a new passkey or security key
   * @param userId - User ID
   * @param authenticatorType - 'platform' for passkeys (Touch ID), 'cross-platform' for hardware keys (YubiKey)
   */
  async generateRegistrationOptions(
    userId: string,
    authenticatorType: 'platform' | 'cross-platform' = 'platform',
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get existing passkeys to exclude them
    const excludeCredentials = user.passkeys.map((passkey) => ({
      id: passkey.credentialId,
      type: 'public-key' as const,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    }));

    // Convert user ID to Uint8Array
    const userIdBuffer = new TextEncoder().encode(user.id);

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userIdBuffer,
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        // Specify authenticator attachment type
        authenticatorAttachment: authenticatorType,
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge temporarily (expires in 5 minutes)
    this.challengeStore.set(userId, options.challenge);
    setTimeout(() => this.challengeStore.delete(userId), 5 * 60 * 1000);

    return options;
  }

  /**
   * Verify and save a new passkey
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    name?: string,
  ): Promise<any> {
    const expectedChallenge = this.challengeStore.get(userId);

    if (!expectedChallenge) {
      throw new BadRequestException('Challenge not found or expired');
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Verification failed: ${message}`);
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new BadRequestException('Registration verification failed');
    }

    // Extract credential info from v13 API structure
    const { credential, aaguid, credentialDeviceType } = registrationInfo;
    const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

    // Convert credentialID to base64url string
    const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');

    // Determine authenticator type based on device type and transports
    // singleDevice = platform authenticator (Touch ID, Windows Hello)
    // multiDevice = cross-platform authenticator (hardware security keys)
    const authenticatorType = credentialDeviceType === 'singleDevice' ? 'platform' : 'cross-platform';

    // Save passkey to database
    const passkey = await this.prisma.passkey.create({
      data: {
        userId,
        credentialId: credentialIdBase64,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        authenticatorType,
        transports: response.response.transports || [],
        aaguid: aaguid ? Buffer.from(aaguid).toString('hex') : null,
        name: name || this.generatePasskeyName(authenticatorType, response.response.transports),
      },
    });

    // Clear challenge
    this.challengeStore.delete(userId);

    return {
      id: passkey.id,
      name: passkey.name,
      authenticatorType: passkey.authenticatorType,
      createdAt: passkey.createdAt,
    };
  }

  /**
   * Generate authentication options for login
   */
  async generateAuthenticationOptions(
    email?: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    let allowCredentials: { id: string; type: 'public-key'; transports?: AuthenticatorTransportFuture[] }[] = [];

    if (email) {
      // Get user's passkeys
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { passkeys: true },
      });

      if (user?.passkeys) {
        allowCredentials = user.passkeys.map((passkey) => ({
          id: passkey.credentialId,
          type: 'public-key' as const,
          transports: passkey.transports as AuthenticatorTransportFuture[],
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge (use email as key if provided, otherwise use challenge itself)
    const challengeKey = email || options.challenge;
    this.challengeStore.set(challengeKey, options.challenge);
    setTimeout(() => this.challengeStore.delete(challengeKey), 5 * 60 * 1000);

    return options;
  }

  /**
   * Verify passkey authentication
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON,
  ): Promise<{ userId: string; accessToken?: string; refreshToken?: string }> {
    // Find passkey by credential ID
    const credentialIdBase64 = response.id;
    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId: credentialIdBase64 },
      include: { user: true },
    });

    if (!passkey) {
      throw new UnauthorizedException('Passkey not found');
    }

    // Get stored challenge (try both user email and challenge itself)
    const expectedChallenge =
      this.challengeStore.get(passkey.user.email) ||
      this.challengeStore.get(response.response.clientDataJSON);

    if (!expectedChallenge) {
      throw new BadRequestException('Challenge not found or expired');
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: passkey.counter,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(`Authentication failed: ${message}`);
    }

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    // Update counter and last used
    await this.prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    // Clear challenge
    this.challengeStore.delete(passkey.user.email);

    return {
      userId: passkey.userId,
    };
  }

  /**
   * Get all passkeys for a user
   */
  async getUserPasskeys(userId: string) {
    const passkeys = await this.prisma.passkey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        authenticatorType: true,
        transports: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return passkeys;
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await this.prisma.passkey.findFirst({
      where: {
        id: passkeyId,
        userId,
      },
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    await this.prisma.passkey.delete({
      where: { id: passkeyId },
    });

    return { success: true };
  }

  /**
   * Rename a passkey
   */
  async renamePasskey(userId: string, passkeyId: string, name: string) {
    const passkey = await this.prisma.passkey.findFirst({
      where: {
        id: passkeyId,
        userId,
      },
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    const updated = await this.prisma.passkey.update({
      where: { id: passkeyId },
      data: { name },
      select: {
        id: true,
        name: true,
        authenticatorType: true,
        transports: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Generate a friendly passkey/security key name based on authenticator type and transports
   */
  private generatePasskeyName(authenticatorType: string, transports: string[] = []): string {
    if (authenticatorType === 'platform') {
      // Platform authenticators (Touch ID, Windows Hello, etc.)
      return 'This Device (Passkey)';
    }

    // Cross-platform authenticators (hardware security keys)
    const transportMap: Record<string, string> = {
      internal: 'Security Key',
      usb: 'USB Security Key',
      ble: 'Bluetooth Security Key',
      nfc: 'NFC Security Key',
    };

    if (transports.length > 0) {
      return transportMap[transports[0]] || 'Security Key';
    }

    return 'Hardware Security Key';
  }
}
