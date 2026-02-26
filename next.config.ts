import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Reduce bundle size by only importing used icons from lucide-react
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },

    // Compress responses
    compress: true,

    // Image optimization
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com", // Google profile images
            },
            {
                protocol: "https",
                hostname: "*.supabase.co", // Supabase storage
            },
        ],
    },

    // Strict mode for better error detection
    reactStrictMode: true,
};

export default nextConfig;
