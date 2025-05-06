// Most basic Express server possible
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

// Fallback route - send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server on the correct port for Replit
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});