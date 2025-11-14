import type maplibregl from "maplibre-gl";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AvatarCard } from "@/components/ui/AvatarCard";
import { seedMonuments } from "@/data/monuments";
import { listMonuments } from "@/server/monuments";
import type { MonumentDetail } from "@/types/monument";

interface HomePageProps {
  monuments: MonumentDetail[];
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    const monuments = await listMonuments();
    const normalized = monuments.map((monument) => {
      const { createdAt, ...rest } = monument;
      void createdAt;
      return rest;
    });

    if (normalized.length > 0) {
      return { props: { monuments: normalized } };
    }
  } catch (error) {
    console.warn("[Home] Falling back to seed data", error);
  }

  return {
    props: {
      monuments: seedMonuments,
    },
  };
};

const mapStyle = "https://demotiles.maplibre.org/style.json";

export default function HomePage({
  monuments,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [selected, setSelected] = useState<MonumentDetail | null>(() => monuments[0] ?? null);
  const [search, setSearch] = useState("");
  const [isMapReady, setMapReady] = useState(false);

  const suggestions = useMemo(() => {
    if (!search) {
      return monuments.slice(0, 5);
    }

    const query = search.toLowerCase();
    return monuments.filter((monument) => {
      const tokens = [monument.name, monument.city ?? "", monument.region ?? ""];
      return tokens.some((field) => field.toLowerCase().includes(query));
    });
  }, [monuments, search]);

  useEffect(() => {
    let mounted = true;

    async function loadMap() {
      if (!mapContainerRef.current || typeof window === "undefined") {
        return;
      }

      const { default: maplibre } = await import("maplibre-gl");

      if (!mounted || !mapContainerRef.current) {
        return;
      }

      const map = new maplibre.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [12.4964, 41.9028],
        zoom: 5,
        attributionControl: false,
      });

      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(
        new maplibre.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap · © MapLibre",
        }),
        "bottom-right",
      );

      const bounds = new maplibre.LngLatBounds();

      const markers = monuments
        .map((monument) => {
          if (typeof monument.lon !== "number" || typeof monument.lat !== "number") {
            return null;
          }

          bounds.extend([monument.lon, monument.lat]);

          const el = document.createElement("button");
          el.className = "monument-pin";
          el.innerHTML = `<span></span>`;
          el.setAttribute("aria-label", `Vai alla scheda di ${monument.name}`);

          const marker = new maplibre.Marker({ element: el, anchor: "bottom" })
            .setLngLat([monument.lon, monument.lat])
            .addTo(map);

          const popup = new maplibre.Popup({
            offset: 24,
            closeButton: false,
            closeOnMove: true,
            className: "monument-popup",
          }).setHTML(
            `<strong>${monument.name}</strong><br/><span>${monument.city}, ${monument.region}</span>`,
          );

          el.addEventListener("mouseenter", () => {
            popup.setLngLat([monument.lon!, monument.lat!]).addTo(map);
          });

          el.addEventListener("mouseleave", () => {
            popup.remove();
          });

          el.addEventListener("click", (event) => {
            event.preventDefault();
            setSelected(monument);
            router.prefetch(`/monument/${monument.slug}`).catch(() => {});
            map.flyTo({
              center: [monument.lon!, monument.lat!],
              zoom: 11,
              pitch: 45,
              speed: 0.8,
            });
          });

          return marker;
        })
        .filter((marker): marker is maplibregl.Marker => Boolean(marker));

      markersRef.current = markers;

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 120, duration: 1200 });
      }

      mapRef.current = map;
      setMapReady(true);
    }

    loadMap().catch((error) => {
      console.error("[Home] Failed to load map", error);
    });

    return () => {
      mounted = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [monuments, router]);

  return (
    <>
      <Head>
        <title>ItalySpot 2.0 · Esplora i monumenti italiani</title>
        <meta
          name="description"
          content="Naviga la mappa e scopri monumenti italiani in formato low-poly interattivo."
        />
        <meta property="og:image" content="/globe.svg" />
      </Head>

      <main className="min-h-screen bg-sand text-ink">
        <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-10 px-6 py-10 lg:grid lg:grid-cols-[420px,1fr] lg:px-12 lg:py-16">
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card flex flex-col gap-4 p-8">
              <p className="text-xs uppercase tracking-[0.4em] text-ochre/70">ItalySpot 2.0</p>
              <h1 className="font-display text-4xl leading-tight lg:text-5xl">
                Esplora i monumenti iconici d&apos;Italia
              </h1>
              <p className="text-base text-ink/70">
                Naviga la mappa, scopri storie e ammira i modelli low-poly dei luoghi simbolo.
              </p>
              <div className="relative mt-2">
                <input
                  type="search"
                  placeholder="Cerca un luogo o un monumento…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-full border border-ochre/30 bg-white/80 px-5 py-3 text-sm text-ink transition focus:border-ochre focus:outline-none focus:ring-2 focus:ring-ochre/60"
                />
                {search ? (
                  <div className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-3xl border border-sage/40 bg-white/90 shadow-lg">
                    {suggestions.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-ink/50">Nessun risultato trovato.</p>
                    ) : (
                      suggestions.slice(0, 6).map((monument) => (
                        <button
                          type="button"
                          key={monument.id}
                          onClick={() => {
                            setSelected(monument);
                            setSearch("");
                            router.prefetch(`/monument/${monument.slug}`).catch(() => {});
                            if (
                              mapRef.current &&
                              typeof monument.lon === "number" &&
                              typeof monument.lat === "number"
                            ) {
                              mapRef.current.flyTo({
                                center: [monument.lon, monument.lat],
                                zoom: 12,
                                speed: 0.9,
                              });
                            }
                          }}
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm text-ink transition hover:bg-sand/80"
                        >
                          <span>
                            {monument.name}
                            <span className="block text-xs text-ink/50">
                              {monument.city}, {monument.region}
                            </span>
                          </span>
                          <span aria-hidden>↗</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
                <span className="rounded-full border border-ochre/30 px-3 py-2">3D Low-Poly</span>
                <span className="rounded-full border border-ochre/30 px-3 py-2">
                  MapLibre · Open Data
                </span>
                <span className="rounded-full border border-ochre/30 px-3 py-2">Tailwind UI</span>
              </div>
            </div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid gap-3"
            >
              {monuments.slice(0, 6).map((monument) => (
                <li key={monument.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(monument);
                      router.prefetch(`/monument/${monument.slug}`).catch(() => {});
                      if (
                        mapRef.current &&
                        typeof monument.lon === "number" &&
                        typeof monument.lat === "number"
                      ) {
                        mapRef.current.flyTo({
                          center: [monument.lon, monument.lat],
                          zoom: 11.5,
                          speed: 0.9,
                        });
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-3xl border border-sand/20 bg-white/70 px-5 py-4 text-left shadow-sm transition hover:border-ochre/40 hover:shadow-glow"
                  >
                    <div>
                      <p className="font-display text-lg">{monument.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                        {monument.city} · {monument.region}
                      </p>
                    </div>
                    <span className="text-2xl text-ochre">⤷</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          </motion.section>

          <section className="relative h-[540px] overflow-hidden rounded-3xl bg-sand shadow-glow lg:h-auto">
            <div ref={mapContainerRef} className="absolute inset-0" aria-hidden={!isMapReady} />
            {!isMapReady ? (
              <div className="absolute inset-0 flex items-center justify-center bg-sand">
                <p className="rounded-full border border-ochre/60 px-6 py-3 font-display text-sm text-ink/70">
                  Caricamento mappa interattiva…
                </p>
              </div>
            ) : null}
            <AnimatePresence>
              {selected ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="pointer-events-auto absolute bottom-6 left-6 max-w-[420px]"
                >
                  <AvatarCard monument={selected} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </>
  );
}
