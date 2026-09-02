const blobStoreHostname = process.env.BLOB_STORE_ID
  ?.replace(/^store_/, "")
  .toLowerCase()

const nextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/internal/social-publish-due": ["./assets/fonts/*.ttf"],
  },
  images: {
    remotePatterns: blobStoreHostname
      ? [
          {
            protocol: "https",
            hostname: `${blobStoreHostname}.public.blob.vercel-storage.com`,
            port: "",
            pathname: "/uploads/**",
            search: "",
          },
        ]
      : [],
  },
}

module.exports = nextConfig
