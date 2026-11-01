/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@soundlounge/shared"],
  reactStrictMode: true,
  serverExternalPackages: ["@distube/ytdl-core"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/@distube/ytdl-core/**/*"],
  },
};

export default nextConfig;
