export interface ExternalMonumentInput {
  name: string;
  city?: string;
  region?: string;
  slug: string;
}

export interface ExternalMonumentData {
  description?: string;
  era?: string;
  source: string;
  wikipediaUrl?: string;
}

export interface ExternalMonumentLocation {
  lat: number;
  lon: number;
}

const WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php";
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

async function http<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchWikidataEntity(
  input: ExternalMonumentInput,
): Promise<ExternalMonumentData | null> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: input.name,
    language: "it",
    format: "json",
    limit: "1",
    origin: "*",
  });

  const query = input.city ?? input.region;
  if (query) {
    params.append("description", query);
  }

  type WikidataResponse = {
    search: Array<{
      id: string;
      description?: string;
      concepturi: string;
    }>;
  };

  const searchResult = await http<WikidataResponse>(`${WIKIDATA_ENDPOINT}?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  const entity = searchResult.search?.[0];

  if (!entity) {
    return null;
  }

  const details = await http<{
    entities: Record<
      string,
      {
        labels: Record<string, { value: string }>;
        descriptions?: Record<string, { value: string }>;
        claims?: Record<string, Array<{ mainsnak?: { datatype: string; datavalue?: unknown } }>>;
      }
    >;
  }>(
    `${WIKIDATA_ENDPOINT}?${new URLSearchParams({
      action: "wbgetentities",
      ids: entity.id,
      format: "json",
      languages: "it",
      origin: "*",
    })}`,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const entityData = details.entities?.[entity.id];
  const description =
    entityData?.descriptions?.it?.value ??
    entityData?.descriptions?.en?.value ??
    entity.description;

  const timelifeClaim = entityData?.claims?.P571?.[0]?.mainsnak;
  let era: string | undefined;

  if (timelifeClaim?.datatype === "time" && typeof timelifeClaim?.datavalue === "object") {
    const { value } = timelifeClaim.datavalue as { value?: { time?: string } };
    if (value?.time) {
      era = new Date(value.time).getUTCFullYear().toString();
    }
  }

  return {
    description,
    era,
    source: entity.concepturi,
    wikipediaUrl: entity.concepturi.replace("www.wikidata.org/wiki", "it.wikipedia.org/wiki"),
  };
}

export async function fetchOpenStreetMapLocation(
  input: ExternalMonumentInput,
): Promise<ExternalMonumentLocation | null> {
  const filters = [`["name"="${input.name}"]`];
  if (input.city) {
    filters.push(`["addr:city"="${input.city}"]`);
  }

  const query = `
    [out:json];
    (
      node${filters.join("")};
      way${filters.join("")};
      relation${filters.join("")};
    );
    out center 1;
  `;

  type OverpassResponse = {
    elements: Array<{
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
    }>;
  };

  const result = await http<OverpassResponse>(OVERPASS_ENDPOINT, {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const first = result.elements?.[0];

  if (!first) {
    return null;
  }

  if (typeof first.lat === "number" && typeof first.lon === "number") {
    return { lat: first.lat, lon: first.lon };
  }

  if (first.center) {
    return first.center;
  }

  return null;
}
