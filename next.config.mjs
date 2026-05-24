/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.mos.cms.futurecdn.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dxomark.com',
      },
      {
        protocol: 'https',
        hostname: 'dlcdnwebimgs.asus.com',
      },
    ],
  },
};

export default nextConfig;
