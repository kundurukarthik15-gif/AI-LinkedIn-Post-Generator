/**
 * Global Express error handler.
 */
function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err.message);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
