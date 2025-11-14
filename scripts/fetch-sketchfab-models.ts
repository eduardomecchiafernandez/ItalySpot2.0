import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { seedMonuments } from "@/data/monuments";

const OUTPUT_DIR = join(process.cwd(), "public", "models", "original");
const API_BASE = "https://api.sketchfab.com/v3/models";

async function downloadBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  return response.arrayBuffer();
}

async function fetchDownloadUrl(uid: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/${uid}/download`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch download link (${response.status})`);
  }

  const payload = (await response.json()) as {
    glb?: { url?: string };
    gltf?: { url?: string };
  };

  const glbUrl = payload.glb?.url ?? payload.gltf?.url;

  if (!glbUrl) {
    throw new Error("Sketchfab response did not expose a downloadable GLB/GLTF");
  }

  return glbUrl;
}

async function main() {
  const token = process.env.SKETCHFAB_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SKETCHFAB_TOKEN. Create a Sketchfab API token and export it before running the script.",
    );
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const targets = seedMonuments.filter((monument) => Boolean(monument.sketchfabUid));

  for (const monument of targets) {
    const uid = monument.sketchfabUid!;
    console.log(`→ Downloading ${monument.name} (${uid})`);

    try {
      const downloadUrl = await fetchDownloadUrl(uid, token);
      const data = await downloadBinary(downloadUrl);
      const filename = `${monument.slug}.glb`;
      const destination = join(OUTPUT_DIR, filename);
      writeFileSync(destination, Buffer.from(data));
      console.log(`   Saved ${basename(destination)}`);
    } catch (error) {
      console.error(`   Failed to download ${monument.name}`, error);
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
