import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    data: {
      name: string;
      color?: string;
      organizationId?: string;
      parentId?: string;
    },
  ) {
    const folder = await this.prisma.folder.create({
      data: {
        name: data.name,
        color: data.color,
        userId,
        organizationId: data.organizationId,
        parentId: data.parentId,
      },
    });

    // Log folder creation
    this.auditService
      .logResourceEvent(
        userId,
        data.organizationId || null,
        "folder.created",
        "Folder",
        folder.id,
        {
          details: {
            name: folder.name,
            color: folder.color,
            parentId: folder.parentId,
          },
        },
      )
      .catch(() => {});

    return folder;
  }

  async findAll(userId: string, organizationId?: string) {
    return this.prisma.folder.findMany({
      where: {
        userId,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        _count: {
          select: { links: true, children: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        links: true,
        _count: {
          select: { links: true, children: true },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // Check if user has access to the folder
    await this.verifyFolderAccess(userId, folder);

    return folder;
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; color?: string },
  ) {
    // Capture BEFORE state
    const before = await this.prisma.folder.findUnique({ where: { id } });

    if (!before) {
      throw new NotFoundException("Folder not found");
    }

    // Check if user has access to the folder
    await this.verifyFolderAccess(userId, before);

    // Perform update
    const after = await this.prisma.folder.update({
      where: { id },
      data,
    });

    // Capture changes and log
    const changes = this.auditService.captureChanges(before, after);
    if (changes) {
      this.auditService
        .logResourceEvent(
          userId,
          before.organizationId || null,
          "folder.updated",
          "Folder",
          id,
          {
            changes,
          },
        )
        .catch(() => {});
    }

    return after;
  }

  async remove(userId: string, id: string) {
    // Capture folder data before deletion
    const folder = await this.prisma.folder.findUnique({ where: { id } });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // Check if user has access to the folder
    await this.verifyFolderAccess(userId, folder);

    // Unlink all links from this folder first
    await this.prisma.link.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Delete the folder
    const result = await this.prisma.folder.delete({ where: { id } });

    // Log deletion event
    this.auditService
      .logResourceEvent(
        userId,
        folder.organizationId || null,
        "folder.deleted",
        "Folder",
        id,
        {
          details: {
            name: folder.name,
            color: folder.color,
          },
        },
      )
      .catch(() => {});

    return result;
  }

  async addLinkToFolder(userId: string, folderId: string, linkId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // Check if user has access to the folder
    await this.verifyFolderAccess(userId, folder);

    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }

    // Verify link belongs to the same organization if folder has one
    if (
      folder.organizationId &&
      link.organizationId !== folder.organizationId
    ) {
      throw new ForbiddenException(
        "Link must belong to the same organization as the folder",
      );
    }

    const updatedLink = await this.prisma.link.update({
      where: { id: linkId },
      data: { folderId },
    });

    // Log link addition to folder
    this.auditService
      .logResourceEvent(
        userId,
        link.organizationId,
        "folder.link_added",
        "Folder",
        folderId,
        {
          details: {
            linkId,
            linkSlug: link.slug,
          },
        },
      )
      .catch(() => {});

    return updatedLink;
  }

  async removeLinkFromFolder(userId: string, linkId: string) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: { folder: true },
    });
    if (!link) {
      throw new NotFoundException("Link not found");
    }

    // Verify user has access to the link's folder if it has one
    if (link.folder) {
      await this.verifyFolderAccess(userId, link.folder);
    }

    // Store folderId before removal for audit logging
    const folderId = link.folderId;

    const updatedLink = await this.prisma.link.update({
      where: { id: linkId },
      data: { folderId: null },
    });

    // Log link removal from folder (only if it was in a folder)
    if (folderId) {
      this.auditService
        .logResourceEvent(
          userId,
          link.organizationId,
          "folder.link_removed",
          "Folder",
          folderId,
          {
            details: {
              linkId,
              linkSlug: link.slug,
            },
          },
        )
        .catch(() => {});
    }

    return updatedLink;
  }

  /**
   * Verify that the user has access to the folder.
   * User has access if they own the folder OR are a member of the folder's organization.
   */
  private async verifyFolderAccess(userId: string, folder: any) {
    // User owns the folder
    if (folder.userId === userId) {
      return;
    }

    // Check if user is a member of the folder's organization
    if (folder.organizationId) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: folder.organizationId,
          },
        },
      });

      if (membership) {
        return;
      }
    }

    throw new ForbiddenException("Access denied to this folder");
  }
}
