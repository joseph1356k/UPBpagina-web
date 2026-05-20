import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this directory so a stray lockfile
  // higher in the path doesn't confuse multi-lockfile detection.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
