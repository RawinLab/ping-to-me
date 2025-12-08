import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {
  Strategy,
  Profile,
  VerifyWithRequest,
} from "@node-saml/passport-saml";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

/**
 * SAML Strategy for SSO authentication
 *
 * Note: This strategy uses a default configuration.
 * For production use with dynamic per-organization config,
 * consider implementing a custom multi-tenant SAML solution
 * or using a service like Auth0, Okta, etc.
 */
@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, "saml") {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiUrl =
      configService.get("NEXT_PUBLIC_API_URL") || "http://localhost:3001";

    // Define the verify callback
    const verifyCallback: VerifyWithRequest = (
      req: any,
      profile: Profile | null | undefined,
      done: (err: any, user?: any, info?: any) => void,
    ) => {
      if (!profile) {
        return done(new Error("Profile not provided"), false);
      }
      // Return profile - actual validation happens in SSOService
      return done(null, profile);
    };

    super(
      {
        passReqToCallback: true,
        entryPoint: "https://default.example.com/sso",
        issuer: `${apiUrl}/auth/sso/saml/metadata/default`,
        callbackUrl: `${apiUrl}/auth/sso/saml/callback/default`,
        idpCert: "default-cert-placeholder",
        acceptedClockSkewMs: 5000,
      },
      verifyCallback,
    );
  }

  // This validate method is called by Passport after super's verify callback
  async validate(
    request: any,
    profile: Profile | null | undefined,
  ): Promise<any> {
    // Extract organization ID from request params
    const organizationId = request.params?.organizationId;

    if (!organizationId) {
      throw new Error("Organization ID not provided");
    }

    if (!profile) {
      throw new Error("Profile not provided");
    }

    // Return profile with organization context
    return {
      ...profile,
      organizationId,
    };
  }
}
