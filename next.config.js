/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  typescript: {
    // Разрешить сборку с мелкими ошибками типов
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорировать ошибки ESLint при сборке
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
