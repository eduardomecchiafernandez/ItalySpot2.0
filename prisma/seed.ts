import { PrismaClient } from "@prisma/client";

import { seedMonuments } from "../src/data/monuments";

const prisma = new PrismaClient();

async function main() {
  await prisma.monument.deleteMany();

  await prisma.monument.createMany({
    data: seedMonuments.map((monument) => ({
      name: monument.name,
      slug: monument.slug,
      city: monument.city,
      region: monument.region,
      lat: monument.lat,
      lon: monument.lon,
      modelUrl: monument.modelUrl,
      sketchfabUid: monument.sketchfabUid,
      description: monument.description,
      era: monument.era,
      source: monument.source,
    })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
