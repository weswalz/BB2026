module.exports = {
  apps: [{
    name: 'biyuboxing',
    script: './dist/server/entry.mjs',
    watch: false,
    autorestart: true,
    env: {
      DATABASE_PATH: '/var/www/biyuboxing/database/biyuboxing.db',
      PORT: 4321,
      NODE_ENV: 'production',
      ADMIN_AUTH_KEY: 'g3xE0UvBzBvE2yVhPYvs!2025',
      LEE_AUTH_KEY: 'c9zXiDmnjZyAAj2Gj8LW!Lee2025',
      SESSION_SECRET: 'BiYu_Session_Secret_2025_Change_This_In_Production',
      SESSION_MAX_AGE: '86400000'
    }
  }]
};