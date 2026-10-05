// ============================================
// CONFIGURATION FILE - EDIT THIS ONLY
// ============================================

module.exports = {
  // Your Hostinger MySQL Database Details
  // Get these from Hostinger hPanel → Databases → MySQL Databases
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',     // e.g., sqlXXX.hostinger.com
    user: process.env.MYSQL_USER || 'u506903612_covia',       // e.g., u506903612_covia
    password: process.env.MYSQL_PASSWORD || 'i5=dPk3K+', // Your database password
    database: process.env.MYSQL_DATABASE || 'u506903612_covia'    // e.g., u506903612_covia
  },

  // Email configuration for OTP sending
  // Use Gmail or your preferred email service
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },

  // Server Port (Hostinger usually provides this via environment variable)
  port: process.env.PORT || 3000
};
