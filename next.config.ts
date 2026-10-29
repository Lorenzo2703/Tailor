import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/animals",
        permanent: true,
      },
      {
        source: "/app/animals",
        destination: "/animals",
        permanent: true,
      },
      {
        source: "/app/animals/:id",
        destination: "/animals",
        permanent: true,
      },
      {
        source: "/app/shelters",
        destination: "/shelters",
        permanent: true,
      },
      {
        source: "/app/favorites",
        destination: "/favorites",
        permanent: true,
      },
      {
        source: "/app/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
