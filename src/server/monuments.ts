import type { Monument } from "@prisma/client";

import { seedMonuments } from "@/data/monuments";

import { prisma } from "./prisma";

export type MonumentDetail = Monument;
export type MonumentSummary = Pick<
  Monument,
  "id" | "name" | "slug" | "lat" | "lon" | "city" | "region" | "modelUrl" | "sketchfabUid"
>;
export type UpsertMonumentInput = Omit<MonumentDetail, "createdAt"> &
  Partial<Pick<MonumentDetail, "createdAt">>;

const fallbackMonuments: MonumentDetail[] = seedMonuments.map((monument, index) => ({
  ...monument,
  city: monument.city ?? null,
  region: monument.region ?? null,
  lat: monument.lat ?? null,
  lon: monument.lon ?? null,
  modelUrl: monument.modelUrl ?? null,
  sketchfabUid: monument.sketchfabUid ?? null,
  description: monument.description ?? null,
  era: monument.era ?? null,
  source: monument.source ?? null,
  createdAt: new Date(Date.UTC(2024, 0, index + 1)),
}));

const fallbackMap = new Map(fallbackMonuments.map((monument) => [monument.slug, monument]));

export async function listMonuments(): Promise<MonumentDetail[]> {
  if (!prisma) {
    return fallbackMonuments;
  }

  try {
    return await prisma.monument.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        createdAt: true,
        description: true,
        era: true,
        modelUrl: true,
        name: true,
        slug: true,
        lat: true,
        lon: true,
        city: true,
        region: true,
        sketchfabUid: true,
        source: true,
      },
    });
  } catch (error) {
    console.warn("[monuments] Database non disponibile, ritorno i dati seed.", error);
    return fallbackMonuments;
  }
}

export async function getMonumentBySlug(slug: string): Promise<MonumentDetail | null> {
  if (!prisma) {
    return fallbackMap.get(slug) ?? null;
  }

  try {
    return await prisma.monument.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        region: true,
        lat: true,
        lon: true,
        description: true,
        era: true,
        source: true,
        modelUrl: true,
        sketchfabUid: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.warn(`[monuments] impossibile leggere ${slug}, ritorno il seed.`, error);
    return fallbackMap.get(slug) ?? null;
  }
}

export async function upsertMonument(monument: UpsertMonumentInput): Promise<MonumentDetail> {
  if (!prisma) {
    throw new Error("Database non configurato: impossibile salvare i monumenti in modalità demo.");
  }

  const { slug, id: _id, createdAt: _createdAt, ...rest } = monument;
  void _id;
  void _createdAt;
  return prisma.monument.upsert({
    where: { slug },
    create: { slug, ...rest },
    update: rest,
  });
}

export async function bulkInsertMonuments(monuments: MonumentDetail[]): Promise<void> {
  if (!prisma) {
    throw new Error("Database non configurato: non posso importare i monumenti senza Postgres.");
  }

  await prisma.monument.deleteMany({
    where: {
      slug: {
        in: monuments.map((m) => m.slug),
      },
    },
  });

  await prisma.monument.createMany({
    data: monuments.map((monument) => ({
      name: monument.name,
      slug: monument.slug,
      city: monument.city,
      region: monument.region,
      lat: monument.lat,
      lon: monument.lon,
      description: monument.description,
      modelUrl: monument.modelUrl,
      sketchfabUid: monument.sketchfabUid,
      era: monument.era,
      source: monument.source,
    })),
    skipDuplicates: true,
  });
}
