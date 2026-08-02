import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import withPWAInit from "@ducanh2912/next-pwa";

// Get commit count
let commitCount = "0";
try {
  commitCount = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn("Could not retrieve git commit count");
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
});

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: `v2.0-${commitCount}`,
  },
};

export default withPWA(nextConfig);
