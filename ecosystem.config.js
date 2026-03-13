module.exports = {
  apps: [
    {
      name: "cinemax",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/cinemax",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/cinemax/error.log",
      out_file: "/var/log/cinemax/out.log",
      merge_logs: true,
    },
  ],
};
