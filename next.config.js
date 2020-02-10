const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

const withOffline = require('next-offline')

module.exports = withOffline(withBundleAnalyzer({
  exportTrailingSlash: true,
  exportPathMap: async function() {
    const routes = {
      '/': { page: '/' }
    }
    return routes
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      }
    }

    return config
  }
}))
