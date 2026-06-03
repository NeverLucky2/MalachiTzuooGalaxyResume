import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * Emit a fully-static `out/` directory — no Node server required.
   * The app has no API routes, no server actions, and no dynamic routes,
   * so it is compatible with static export.  Deploy `out/` to S3 (or any
   * static host) as-is.
   */
  output: "export",

  /**
   * Silence the "multiple lockfiles / inferred workspace root" warning that
   * Turbopack emits when it crawls parent directories and finds other
   * package-lock.json files.  Pinning root to this project directory
   * confines Turbopack's filesystem watching to the project.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
