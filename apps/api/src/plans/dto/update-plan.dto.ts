import { PartialType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

/**
 * Update plan DTO - all fields are optional
 * Inherits validation from CreatePlanDto
 */
export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
