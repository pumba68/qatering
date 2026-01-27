/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  compiler: {
    emotion: true,
  },
}

module.exports = nextConfig
