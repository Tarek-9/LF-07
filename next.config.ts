const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3008/api/:path*', // leitet API-Anfragen weiter
      },
    ];
  },
};

module.exports = nextConfig;
