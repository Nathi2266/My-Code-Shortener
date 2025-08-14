const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(
		['/api', '/detect', '/upgrade', '/process-zip', '/metrics'],
		createProxyMiddleware({
			target: 'http://localhost:5000',
			changeOrigin: true,
			ws: false,
			logLevel: 'silent',
			pathRewrite: {
				'^/api': '/api'
			}
		})
	);
};

