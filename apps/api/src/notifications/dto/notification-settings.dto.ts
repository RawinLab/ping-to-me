import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmailsEnabled?: boolean;
}

export class NotificationSettingsResponseDto {
  emailNotificationsEnabled: boolean;
  marketingEmailsEnabled: boolean;
}
