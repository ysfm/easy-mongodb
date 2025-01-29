// app.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Function to build the frontend
const buildFrontend = () => {
  return new Promise((resolve, reject) => { 
    const frontendPath = path.join(__dirname, 'easymongodb-frontend');
    
    // Check if frontend directory exists
    if (!fs.existsSync(frontendPath)) {
      return reject(new Error('Frontend directory does not exist.'));
    }

    console.log('Building the frontend...');
    exec('npm run build', { cwd: frontendPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error building frontend: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`Build stderr: ${stderr}`);
      }
      console.log(`Frontend build stdout: ${stdout}`);
      resolve();
    });
  });
};

// Function to serve the frontend
const serveFrontend = () => {
  const frontendDistPath = path.join(__dirname, 'easymongodb-frontend', 'dist');
  
  // Check if dist directory exists
  if (!fs.existsSync(frontendDistPath)) {
    throw new Error('Frontend dist directory does not exist. Please build the frontend first.');
  }

  // Serve static files from the Vue.js app
  app.use(express.static(frontendDistPath));

  // Handle SPA routing, return all requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
};

// Start the server after building the frontend
const PORT = process.env.PORT || 3000;

buildFrontend()
  .then(() => {
    serveFrontend();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to build and serve frontend:', error);
    process.exit(1); // Exit the process with failure
  });
