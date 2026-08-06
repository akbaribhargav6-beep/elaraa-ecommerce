/** @type {import('next').NextConfig} */

// Product/category photos are served by the backend at <API_URL>/uploads/**.
// Next's <Image> requires every remote host it fetches from to be allow-
// listed, so the deployed backend's real domain (e.g. the Railway URL) has
// to be added here too, not just localhost:4000 used in local dev.
const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
];

if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    remotePatterns.push({
      protocol: apiUrl.protocol.replace(':', ''),
      hostname: apiUrl.hostname,
      port: apiUrl.port || '',
      pathname: '/uploads/**',
    });
  } catch {
    // Malformed NEXT_PUBLIC_API_URL — fall through with just the localhost pattern.
  }
}

const nextConfig = {
  transpilePackages: ['@elaraa/shared'],
  images: { remotePatterns },
};

module.exports = nextConfig;
