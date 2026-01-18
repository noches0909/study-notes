import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eo-img.521799.xyz",
        pathname: "/**",
        port: "",
      },
    ],
  },
}

export default nextConfig
