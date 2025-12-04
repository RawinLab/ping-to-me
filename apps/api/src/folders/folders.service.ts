import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, data: { name: string; color?: string }) {
    return this.prisma.folder.create({
      data: {
        name: data.name,
        color: data.color,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { links: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        links: true,
        _count: {
          select: { links: true }
        }
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return folder;
  }

  async update(userId: string, id: string, data: { name?: string; color?: string }) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.folder.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Unlink all links from this folder first
    await this.prisma.link.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    return this.prisma.folder.delete({ where: { id } });
  }

  async addLinkToFolder(userId: string, folderId: string, linkId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.link.update({
      where: { id: linkId },
      data: { folderId },
    });
  }

  async removeLinkFromFolder(userId: string, linkId: string) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.link.update({
      where: { id: linkId },
      data: { folderId: null },
    });
  }
}
