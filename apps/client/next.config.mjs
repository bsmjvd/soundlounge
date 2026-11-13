import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@soundlounge/shared"],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@distube/ytdl-core"],
  experimental: {
    // Run middleware in the Node runtime: the edge sandbox disallows dynamic
    // codegen, which crashes dev middleware whenever NODE_ENV=production leaks
    // into the environment (e.g. set globally in a shell profile).
    nodeMiddleware: true,
  },
};

export default nextConfig;
