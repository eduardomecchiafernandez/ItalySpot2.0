import type { AppProps } from "next/app";
import { Inter, Playfair_Display } from "next/font/google";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "framer-motion";

import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation}>
        <div className={`${playfair.variable} ${inter.variable} font-sans`}>
          <Component {...pageProps} />
        </div>
      </LazyMotion>
    </QueryClientProvider>
  );
}

export default MyApp;
