import type { NextApiRequest, NextApiResponse } from "next";

import {
  fetchOpenStreetMapLocation,
  fetchWikidataEntity,
  type ExternalMonumentInput,
} from "@/lib/api";
import { getMonumentBySlug, upsertMonument } from "@/server/monuments";

interface ImportRequestBody {
  monuments: Array<
    ExternalMonumentInput & {
      modelUrl?: string;
      sketchfabUid?: string;
    }
  >;
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  const body = request.body as ImportRequestBody | undefined;

  if (!body || !Array.isArray(body.monuments)) {
    return response.status(400).json({ message: "Invalid payload" });
  }

  try {
    const results = await Promise.all(
      body.monuments.map(async (monumentInput) => {
        const existing = await getMonumentBySlug(monumentInput.slug);

        const [wikidata, osmLocation] = await Promise.all([
          fetchWikidataEntity(monumentInput),
          fetchOpenStreetMapLocation(monumentInput),
        ]);

        const lat = osmLocation?.lat ?? existing?.lat;
        const lon = osmLocation?.lon ?? existing?.lon;

        if (typeof lat !== "number" || typeof lon !== "number") {
          throw new Error(
            `Missing coordinates for ${monumentInput.name}. Aggiungi lat/lon manualmente prima di importare.`,
          );
        }

        const payload = {
          id: existing?.id ?? "",
          name: monumentInput.name,
          slug: monumentInput.slug,
          city: monumentInput.city ?? existing?.city ?? "",
          region: monumentInput.region ?? existing?.region ?? "",
          lat,
          lon,
          description: wikidata?.description ?? existing?.description ?? "",
          modelUrl: monumentInput.modelUrl ?? existing?.modelUrl ?? "",
          sketchfabUid: monumentInput.sketchfabUid ?? existing?.sketchfabUid ?? null,
          era: wikidata?.era ?? existing?.era ?? null,
          source: wikidata?.source ?? existing?.source ?? null,
        };

        const updated = await upsertMonument(payload);

        return {
          slug: updated.slug,
          imported: true,
        };
      }),
    );

    return response.status(200).json({ ok: true, results });
  } catch (error) {
    console.error("[api/import] error", error);
    return response.status(500).json({ message: "Import failed" });
  }
}
