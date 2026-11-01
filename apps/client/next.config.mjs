import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@soundlounge/shared"],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@distube/ytdl-core"],
};

export default nextConfig;
