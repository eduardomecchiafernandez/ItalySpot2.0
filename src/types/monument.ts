export interface MonumentSummary {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
  modelUrl: string | null;
  sketchfabUid: string | null;
}

export interface MonumentDetail extends MonumentSummary {
  description: string | null;
  era: string | null;
  source: string | null;
}
