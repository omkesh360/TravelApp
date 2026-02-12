const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files with caching policies
app.use(express.static(path.join(__dirname), {
  maxAge: '1d', // Cache static assets for 1 day
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML files should not be cached to ensure updates are seen immediately
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Other assets (CSS, JS, Images) can be cached
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day in seconds
    }
  }
}));

// Route for root to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});
