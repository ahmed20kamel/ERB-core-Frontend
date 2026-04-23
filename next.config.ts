import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7410',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '7410',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
