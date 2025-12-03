import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@pingtome/database';

export const Roles = (...roles: MemberRole[]) => SetMetadata('roles', roles);
