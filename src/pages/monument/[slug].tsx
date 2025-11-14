import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

import { MonumentViewer } from "@/components/3D/MonumentViewer";
import { AvatarCard } from "@/components/ui/AvatarCard";
import { seedMonuments } from "@/data/monuments";
import { getMonumentBySlug, listMonuments } from "@/server/monuments";
import type { MonumentDetail } from "@/types/monument";

interface MonumentPageProps {
  monument: MonumentDetail;
  related: MonumentDetail[];
}

export const getServerSideProps: GetServerSideProps<MonumentPageProps> = async (context) => {
  const slug = context.params?.slug;

  if (typeof slug !== "string") {
    return { notFound: true };
  }

  try {
    const [monument, allMonuments] = await Promise.all([getMonumentBySlug(slug), listMonuments()]);

    if (monument) {
      const normalizedMonument = (() => {
        const { createdAt, ...rest } = monument;
        void createdAt;
        return rest;
      })();
      const normalizedRelated = allMonuments
        .filter((item) => item.slug !== slug)
        .slice(0, 3)
        .map((item) => {
          const { createdAt, ...rest } = item;
          void createdAt;
          return rest;
        });

      return {
        props: {
          monument: normalizedMonument,
          related: normalizedRelated,
        },
      };
    }
  } catch (error) {
    console.error(`[MonumentPage] failed to load ${slug}`, error);
  }

  const fallback = seedMonuments.find((item) => item.slug === slug);

  if (!fallback) {
    return { notFound: true };
  }

  const related = seedMonuments.filter((item) => item.slug !== slug).slice(0, 3);

  return {
    props: {
      monument: fallback,
      related,
    },
  };
};

export default function MonumentPage({
  monument,
  related,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>{monument.name} · ItalySpot 2.0</title>
        <meta
          name="description"
          content={`Scopri il ${monument.name}, ${monument.city} (${monument.region}) in versione low-poly interattiva.`}
        />
        <meta property="og:title" content={`${monument.name} · ItalySpot 2.0`} />
        <meta property="og:image" content="/globe.svg" />
      </Head>

      <main className="min-h-screen bg-sand px-6 py-12 text-ink lg:px-12 lg:py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 lg:gap-16">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-ochre/70">Monumento</p>
              <h1 className="font-display text-4xl lg:text-5xl">{monument.name}</h1>
              <p className="mt-2 text-sm uppercase tracking-[0.3em] text-ink/60">
                {monument.city} · {monument.region}
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-ochre/40 bg-ochre/10 px-6 py-3 text-sm uppercase tracking-[0.3em] text-ink transition hover:bg-ochre/30 focus:outline-none focus-visible:ring focus-visible:ring-ochre/60"
            >
              ← Torna alla mappa
            </Link>
          </motion.header>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr),420px]">
            <MonumentViewer
              title={monument.name}
              modelUrl={monument.modelUrl}
              sketchfabUid={monument.sketchfabUid}
            />

            <div className="space-y-6">
              <AvatarCard monument={monument} ctaLabel="Visita la pagina ufficiale" />
              {monument.description ? (
                <div className="glass-card p-6 text-sm leading-relaxed text-ink/75">
                  {monument.description}
                </div>
              ) : null}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="glass-card p-6">
              <h2 className="font-display text-2xl">Altri luoghi da esplorare</h2>
              <ul className="mt-4 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/monument/${item.slug}`}
                      className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-sand/30 bg-white/70 px-5 py-6 text-ink transition hover:border-ochre/40 hover:shadow-glow"
                    >
                      <div>
                        <p className="font-display text-lg">{item.name}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                          {item.city} · {item.region}
                        </p>
                      </div>
                      <span className="text-right text-2xl text-ochre">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
