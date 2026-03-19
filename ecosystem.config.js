module.exports = {
  apps: [{
    name: 'suno-api',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3100',
    cwd: 'C:/dev/api-suno-ai',
    env: {
      NODE_ENV: 'production',
      PORT: '3100'
    }
  }]
};
