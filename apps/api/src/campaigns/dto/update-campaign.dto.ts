import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(OmitType(CreateCampaignDto, ['organizationId'] as const)) {}
