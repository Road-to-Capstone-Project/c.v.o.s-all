const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "cms-assets.xboxservices.com",
      },
      {
        protocol: "https",
        hostname: "store-images.s-microsoft.com",
      },
      {
        protocol: "https",
        hostname: "assets.nintendo.com",
      },
      {
        protocol: "https",
        hostname: `${process.env.SUPABASE_UNIQUE_ID}.supabase.co`,
      },
      {
        protocol: "https",
        hostname: "media.direct.playstation.com",
      },
      {
        protocol: "https",
        hostname: "gamesir.com",
      },
      {
        protocol: "https",
        hostname: "assets.xboxservices.com",
      },
      {
        protocol: "https",
        hostname: "dlcdnwebimgs.asus.com",
      },
    ],
  },
}

module.exports = nextConfig
