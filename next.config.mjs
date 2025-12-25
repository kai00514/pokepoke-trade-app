import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverComponentsExternalPackages: ['@google-cloud/translate'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Google Cloud libraries on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        tls: false,
        net: false,
        crypto: false,
      };
    }
    return config;
  },
}

export default withNextIntl(nextConfig);
