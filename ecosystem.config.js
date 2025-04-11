module.exports = {
  apps : [
    {
      name   : "user-info-frontend",
      script : "npm",
      args   : "start",
      cwd    : "./frontend", // Run 'npm start' in the frontend directory
      watch  : false, // Production build doesn't need watching
      env    : {
        NODE_ENV: "production",
        PORT: 3000 // Ensure Next.js starts on port 3000
      }
    }
    // Removed backend configuration as requested
  ]
};