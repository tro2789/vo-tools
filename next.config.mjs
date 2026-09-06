/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // The analysis workspace is the home page as of 2026-09-06.
      { source: "/script-analysis", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
