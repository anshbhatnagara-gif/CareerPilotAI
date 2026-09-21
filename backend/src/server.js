const app = require('./app');
const config = require('./config/env');

const PORT = config.PORT;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`CareerPilot AI Backend running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`CORS Allowed Origin: ${config.FRONTEND_URL}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});
