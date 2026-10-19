import type { NextConfig } from 'next';

// L'hosting pubblico e il reverse proxy Aruba servono Evolve sotto /evolve.
// Senza basePath, Vercel genera / ma /evolve restituisce 404.
const nextConfig: NextConfig = {
  basePath: '/evolve',
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
