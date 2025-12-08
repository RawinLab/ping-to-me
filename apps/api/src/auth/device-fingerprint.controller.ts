import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DeviceFingerprintService } from "./device-fingerprint.service";
import { GetUser } from "./decorators";

@Controller("auth/devices")
@UseGuards(AuthGuard("jwt"))
export class DeviceFingerprintController {
  constructor(
    private readonly deviceFingerprintService: DeviceFingerprintService,
  ) {}

  @Get()
  async getTrustedDevices(@GetUser() user: any) {
    return this.deviceFingerprintService.getTrustedDevices(user.id);
  }

  @Get("current")
  async getCurrentDevice(
    @GetUser() user: any,
    @Query("fingerprint") fingerprint: string,
  ) {
    if (!fingerprint) {
      return { device: null };
    }

    const device = await this.deviceFingerprintService.getDeviceByFingerprint(
      user.id,
      fingerprint,
    );

    return { device };
  }

  @Post("trust")
  async trustDevice(
    @GetUser() user: any,
    @Body("fingerprint") fingerprint: string,
    @Req() req,
  ) {
    if (!fingerprint) {
      return { message: "Fingerprint is required" };
    }

    const deviceInfo = this.deviceFingerprintService.extractDeviceInfo(
      fingerprint,
      req,
    );
    const device = await this.deviceFingerprintService.trustDevice(
      user.id,
      deviceInfo,
    );

    return {
      message: "Device trusted successfully",
      device,
    };
  }

  @Patch(":id/name")
  async updateDeviceName(
    @GetUser() user: any,
    @Param("id") deviceId: string,
    @Body("name") name: string,
  ) {
    return this.deviceFingerprintService.updateDeviceName(
      user.id,
      deviceId,
      name,
    );
  }

  @Delete(":id")
  async removeDevice(@GetUser() user: any, @Param("id") deviceId: string) {
    return this.deviceFingerprintService.removeTrustedDevice(user.id, deviceId);
  }

  @Post("revoke-all")
  async revokeAllDevices(
    @GetUser() user: any,
    @Body("exceptFingerprint") exceptFingerprint?: string,
  ) {
    return this.deviceFingerprintService.revokeAllDevices(
      user.id,
      exceptFingerprint,
    );
  }
}
