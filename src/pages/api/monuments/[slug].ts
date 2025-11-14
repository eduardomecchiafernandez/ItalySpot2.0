import type { NextApiRequest, NextApiResponse } from "next";

import { getMonumentBySlug } from "@/server/monuments";
import { seedMonuments } from "@/data/monuments";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const slug = request.query.slug;

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  if (typeof slug !== "string") {
    return response.status(400).json({ message: "Invalid slug" });
  }

  try {
    const monument = await getMonumentBySlug(slug);

    if (monument) {
      response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
      return response.status(200).json(monument);
    }
  } catch (error) {
    console.error(`[api/monuments/${slug}] error`, error);
  }

  const fallback = seedMonuments.find((item) => item.slug === slug);

  if (!fallback) {
    return response.status(404).json({ message: "Monument not found" });
  }

  return response.status(200).json(fallback);
}
