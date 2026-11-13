/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // The analysis workspace is the home page as of 2026-09-06.
      { source: "/script-analysis", destination: "/", permanent: true },
      // The ACX checker was replaced by Spec Check on 2026-11-13.
      { source: "/acx-check", destination: "https://www.trevorohare.com/spec-check", permanent: true },
    ];
  },
};

export default nextConfig;
