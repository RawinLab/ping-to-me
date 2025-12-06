/**
 * Migration Script: Migrate BioPage content.links to BioPageLink model
 *
 * This script migrates existing JSON links stored in BioPage.content to
 * the new BioPageLink relational model.
 *
 * Usage: pnpm --filter @pingtome/database db:migrate-bio-links
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LegacyLink {
  url: string;
  title: string;
  description?: string;
  icon?: string;
}

interface LegacyLinkContent {
  links?: LegacyLink[] | string[]; // Could be objects or link IDs
}

async function main() {
  console.log('Starting BioPageLink migration...\n');

  // Find all bio pages with content that has links
  const bioPages = await prisma.bioPage.findMany({
    where: {
      content: {
        not: undefined,
      },
    },
    include: {
      bioLinks: {
        select: { id: true },
      },
    },
  });

  console.log(`Found ${bioPages.length} bio pages with content\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const bioPage of bioPages) {
    try {
      // Skip if already has bioLinks
      if (bioPage.bioLinks.length > 0) {
        console.log(`[SKIP] ${bioPage.slug}: Already has ${bioPage.bioLinks.length} bioLinks`);
        skippedCount++;
        continue;
      }

      const content = bioPage.content as LegacyLinkContent | null;
      const legacyLinks = content?.links || [];

      if (legacyLinks.length === 0) {
        console.log(`[SKIP] ${bioPage.slug}: No links in content`);
        skippedCount++;
        continue;
      }

      console.log(`[MIGRATE] ${bioPage.slug}: Migrating ${legacyLinks.length} links...`);

      // Check if links are objects (url/title) or strings (link IDs)
      const isObjectFormat = legacyLinks.length > 0 && typeof legacyLinks[0] === 'object';

      let bioLinksData: Array<{
        bioPageId: string;
        linkId?: string;
        externalUrl?: string;
        title: string;
        description?: string;
        icon?: string;
        order: number;
        isVisible: boolean;
      }> = [];

      if (isObjectFormat) {
        // Handle object format: { url, title }
        bioLinksData = (legacyLinks as LegacyLink[]).map((link, index) => ({
          bioPageId: bioPage.id,
          externalUrl: link.url,
          title: link.title || 'Untitled Link',
          description: link.description,
          icon: link.icon,
          order: index,
          isVisible: true,
        }));
      } else {
        // Handle string format: link IDs
        const linkIds = legacyLinks as string[];

        // Fetch the actual links to get their titles
        const links = await prisma.link.findMany({
          where: {
            id: { in: linkIds },
          },
          select: {
            id: true,
            title: true,
            originalUrl: true,
          },
        });

        // Create a map for quick lookup
        const linkMap = new Map(links.map((l) => [l.id, l]));

        bioLinksData = linkIds
          .map((linkId, index) => {
            const link = linkMap.get(linkId);
            if (!link) {
              console.log(`  [WARN] Link ${linkId} not found, skipping`);
              return null;
            }
            return {
              bioPageId: bioPage.id,
              linkId: link.id,
              title: link.title || 'Untitled Link',
              order: index,
              isVisible: true,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      }

      if (bioLinksData.length > 0) {
        await prisma.bioPageLink.createMany({
          data: bioLinksData,
        });
        console.log(`  [OK] Created ${bioLinksData.length} bioLinks`);
        migratedCount++;
      }
    } catch (error) {
      console.error(`[ERROR] ${bioPage.slug}: ${error}`);
      errorCount++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('------------------------\n');

  if (errorCount === 0) {
    console.log('Migration completed successfully!');
  } else {
    console.log('Migration completed with errors. Please review the logs above.');
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
