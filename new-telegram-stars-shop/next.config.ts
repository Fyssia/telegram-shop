import type { NextConfig } from "next";

const PROD_PUBLIC_DOMAIN = "https://www.quackstars.com";
const LOCAL_BACKEND_API_BASE_URL = "http://localhost:8081";

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const BACKEND_API_BASE_URL = stripTrailingSlash(
  process.env.BACKEND_API_BASE_URL ??
    (process.env.NODE_ENV === "production"
      ? PROD_PUBLIC_DOMAIN
      : LOCAL_BACKEND_API_BASE_URL),
);

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/tg/:path*",
        destination: `${BACKEND_API_BASE_URL}/api/tg/:path*`,
      },
      {
        source: "/api/payments/:path*",
        destination: `${BACKEND_API_BASE_URL}/api/payments/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t.me",
        pathname: "/i/userpic/**",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
