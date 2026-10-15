/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingIncludes: { '/*': ['./generated/**/*.json'] },
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};
export default config;
