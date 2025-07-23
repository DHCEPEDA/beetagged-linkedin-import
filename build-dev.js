#!/usr/bin/env node
// Build script for development mode using Vite
const { spawn } = require('child_process');

console.log('Starting Vite build in development mode...');

const vite = spawn('npx', ['vite', 'build', '--mode', 'development'], {
  stdio: 'inherit',
  shell: true
});

vite.on('close', (code) => {
  console.log(`Vite build process exited with code ${code}`);
  process.exit(code);
});

vite.on('error', (err) => {
  console.error('Failed to start Vite build:', err);
  process.exit(1);
});