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
  // This is optional - if not configured, email OTP will be disabled
  // For Gmail: You need to generate an App Password from Google Account settings
  // Go to: https://myaccount.google.com/security -> 2-Step Verification -> App Passwords
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'mukulgarg334@gmail.com',
    pass: process.env.EMAIL_PASS || 'etqd pykm eyle exxa'
  },

  // Supabase configuration for image storage
  // Set these as environment variables on Hostinger
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    bucket: process.env.SUPABASE_BUCKET || 'profile-photos'
  },

  // Server Port (Hostinger usually provides this via environment variable)
  port: process.env.PORT || 3000
};
