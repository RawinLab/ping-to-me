import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const blockedDomains = [
    { domain: "phishing.com", reason: "Phishing" },
    { domain: "malware.com", reason: "Malware" },
    { domain: "spam.com", reason: "Spam" },
  ];

  console.log("Seeding blocked domains...");
  for (const item of blockedDomains) {
    await prisma.blockedDomain.upsert({
      where: { domain: item.domain },
      update: {},
      create: item,
    });
  }
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
