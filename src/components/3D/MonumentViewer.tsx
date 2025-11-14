import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import Image from "next/image";

function isWebglAvailable(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (error) {
    console.error("[MonumentViewer] WebGL check failed", error);
    return false;
  }
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

useGLTF.preload?.("/models/colosseum.glb");
useGLTF.preload?.("/models/duomo.glb");
useGLTF.preload?.("/models/tower.glb");

interface MonumentViewerProps {
  title: string;
  modelUrl?: string | null;
  sketchfabUid?: string | null;
  fallbackImage?: string;
}

export function MonumentViewer({
  title,
  modelUrl,
  sketchfabUid,
  fallbackImage,
}: MonumentViewerProps) {
  const [enabled, setEnabled] = useState(() => isWebglAvailable());

  useEffect(() => {
    setEnabled(isWebglAvailable());
  }, []);

  const fallbackSrc = useMemo(() => fallbackImage ?? "/globe.svg", [fallbackImage]);

  if (!modelUrl && !sketchfabUid) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-3xl bg-sand/60 p-10 text-center shadow-glow">
        <Image
          src={fallbackSrc}
          alt={`Anteprima statica del ${title}`}
          width={240}
          height={240}
          className="h-48 w-48 object-contain opacity-80"
        />
        <div>
          <h3 className="font-display text-2xl text-ink">Modello non disponibile</h3>
          <p className="mt-2 max-w-sm text-sm text-ink/70">
            Stiamo lavorando per acquisire il modello originale di questo monumento.
          </p>
        </div>
      </div>
    );
  }

  if (!modelUrl && sketchfabUid) {
    return (
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-3xl bg-ink/90 shadow-glow">
        <iframe
          title={`Visualizzazione 3D di ${title}`}
          src={`https://sketchfab.com/models/${sketchfabUid}/embed?preload=1&autostart=1&autospin=0.2&camera=0`}
          className="h-full w-full"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-right text-xs uppercase tracking-[0.4em] text-white/70">
          Fonte: Sketchfab
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-3xl bg-sand/60 p-10 text-center shadow-glow">
        <Image
          src={fallbackSrc}
          alt={`Anteprima statica del ${title}`}
          width={240}
          height={240}
          className="h-48 w-48 object-contain opacity-80"
        />
        <div>
          <h3 className="font-display text-2xl text-ink">Vista 3D non disponibile</h3>
          <p className="mt-2 max-w-sm text-sm text-ink/70">
            Il tuo browser non supporta WebGL. Ti suggeriamo di aggiornare il browser o di
            consultare l&apos;immagine statica qui sopra.
          </p>
        </div>
      </div>
    );
  }

  return modelUrl ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative h-[60vh] min-h-[400px] w-full overflow-hidden rounded-3xl bg-linear-to-br from-sand/80 via-sage/60 to-ochre/40 shadow-glow"
    >
      <Canvas camera={{ position: [0, 1.2, 3.2], fov: 40 }} dpr={[1, 2]} frameloop="demand">
        <Suspense
          fallback={
            <Html center className="rounded-full bg-white/80 px-6 py-3 font-display text-sm">
              Caricamento modello…
            </Html>
          }
        >
          <Stage intensity={0.6} environment="city" shadows adjustCamera>
            <Model url={modelUrl} />
          </Stage>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.6}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="rounded-full bg-sand/70 px-5 py-2 text-xs uppercase tracking-[0.4em] text-ink/60">
          Rotazione automatica · {title}
        </div>
      </div>
    </motion.div>
  ) : null;
}
