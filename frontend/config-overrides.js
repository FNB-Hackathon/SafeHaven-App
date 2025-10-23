module.exports = function override(config, env) {
  // Disable host check in development
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      allowedHosts: 'all',
      host: '0.0.0.0',
      https: true
    };
  }
  return config;
};
