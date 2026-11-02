export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.name === 'ZodError') {
    return res.status(400).json({ message: err.issues?.[0]?.message || 'Invalid request data.' });
  }
  const status = err.status || 500;
  res.status(status).json({
    message: status >= 500
      ? (err.expose ? err.message : 'Server error. Check the server terminal for details.')
      : err.message
  });
}
