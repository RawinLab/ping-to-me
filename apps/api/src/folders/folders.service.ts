import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

  async findAll(userId: string, organizationId?: string, parentId?: string | null) {
    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    } else {
      where.userId = userId;
    }

    // Filter by parent (null means root folders)
    if (parentId === 'root' || parentId === null) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    return this.prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { links: true, children: true },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
          },
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

  async move(userId: string, folderId: string, newParentId: string | null) {
    // Get folder to move
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { children: true },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Verify access
    await this.verifyFolderAccess(userId, folder);

    // Prevent moving to itself
    if (newParentId === folderId) {
      throw new BadRequestException('Cannot move folder to itself');
    }

    // If moving to a parent, verify the parent exists and belongs to same org
    if (newParentId) {
      const newParent = await this.prisma.folder.findUnique({
        where: { id: newParentId },
      });

      if (!newParent) {
        throw new NotFoundException('Parent folder not found');
      }

      if (newParent.organizationId !== folder.organizationId) {
        throw new BadRequestException('Cannot move folder to different organization');
      }

      // Prevent circular reference - check if newParent is a descendant of folder
      const isCircular = await this.isDescendant(newParentId, folderId);
      if (isCircular) {
        throw new BadRequestException('Cannot move folder to its own descendant');
      }
    }

    // Get before state for audit
    const before = { parentId: folder.parentId };

    // Update folder
    const updated = await this.prisma.folder.update({
      where: { id: folderId },
      data: { parentId: newParentId },
    });

    // Audit log
    this.auditService.logResourceEvent(
      userId,
      folder.organizationId,
      'folder.moved',
      'Folder',
      folderId,
      {
        changes: {
          before: { parentId: before.parentId },
          after: { parentId: newParentId },
        },
        details: {
          name: folder.name,
          newParentId,
        },
      }
    ).catch(() => {});

    return updated;
  }

  async getTree(userId: string, organizationId: string) {
    // Get all folders for the organization
    const allFolders = await this.prisma.folder.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { links: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const folderMap = new Map(allFolders.map(f => [f.id, { ...f, children: [] as any[] }]));
    const rootFolders: any[] = [];

    for (const folder of allFolders) {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(folderWithChildren);
      } else {
        rootFolders.push(folderWithChildren);
      }
    }

    return rootFolders;
  }

  // Helper to check if targetId is a descendant of ancestorId
  private async isDescendant(targetId: string, ancestorId: string): Promise<boolean> {
    const target = await this.prisma.folder.findUnique({
      where: { id: targetId },
      select: { parentId: true },
    });

    if (!target || !target.parentId) {
      return false;
    }

    if (target.parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(target.parentId, ancestorId);
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
