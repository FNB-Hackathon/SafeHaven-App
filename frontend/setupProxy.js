const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      ws: true,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('host', 'localhost:3000');
      },
    })
  );
};
