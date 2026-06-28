/**
 * AI LinkedIn Automation Assistant
 * Entry point — starts Express server and serves optional frontend.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const { config } = require('./config/env');
const postRoutes = require('./routes/postRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Parse JSON bodies for API requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve simple frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// API routes (prefix /api for clarity)
app.use('/api', postRoutes);

// Friendly aliases matching project spec (same handlers)
app.use('/', postRoutes);

// 404 for unknown API paths
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.accepts('json') === 'application/json') {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  const linkedinMode = config.mockLinkedInPublish
    ? 'MOCK (no real posts)'
    : 'LIVE via Composio';
  console.log(`
  LinkedIn AI Automation Assistant
  ------------------------------
  Server:   http://localhost:${config.port}
  UI:       http://localhost:${config.port}
  Health:   http://localhost:${config.port}/api/health
  LinkedIn: ${linkedinMode}
  AI:       ${config.ai.provider}

  Workflow: Generate -> Preview -> Confirm -> Publish
  `);
});
