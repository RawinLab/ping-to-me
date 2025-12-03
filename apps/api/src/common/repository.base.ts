import { PrismaClient } from '@pingtome/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(protected readonly prisma: PrismaClient) { }

  abstract create(data: CreateDto): Promise<T>;
  abstract findAll(): Promise<T[]>;
  abstract findOne(id: string): Promise<T | null>;
  abstract update(id: string, data: UpdateDto): Promise<T>;
  abstract remove(id: string): Promise<T>;
}
