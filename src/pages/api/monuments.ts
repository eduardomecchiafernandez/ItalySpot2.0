import type { NextApiRequest, NextApiResponse } from "next";

import { listMonuments } from "@/server/monuments";
import { seedMonuments } from "@/data/monuments";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const monuments = await listMonuments();

    if (monuments.length === 0) {
      return response.status(200).json(seedMonuments);
    }

    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

    return response.status(200).json(monuments);
  } catch (error) {
    console.error("[api/monuments] error", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
}
