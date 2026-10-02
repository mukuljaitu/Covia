// ============================================
// CONFIGURATION FILE - EDIT THIS ONLY
// ============================================

module.exports = {
  // Your Hostinger MySQL Database Details
  // Get these from Hostinger hPanel → Databases → MySQL Databases
  mysql: {
    host: 'localhost',     // e.g., sqlXXX.hostinger.com
    user: 'u506903612_covia',       // e.g., u506903612_covia
    password: 'i5=dPk3K+', // Your database password
    database: 'u506903612_covia'    // e.g., u506903612_covia
  },

  // Server Port (Hostinger usually provides this via environment variable)
  port: process.env.PORT || 3000
};
