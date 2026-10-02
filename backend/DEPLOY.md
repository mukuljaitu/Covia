# 🚀 Easy Hostinger Deployment Guide

## 🎯 Method 1: Using Git Repository (Easiest)

### Step 1: Edit config.js (ONLY FILE TO EDIT)

Open `backend/config.js` and fill in your Hostinger MySQL details:

```javascript
mysql: {
  host: 'YOUR_HOSTINGER_MYSQL_HOST',     // e.g., sqlXXX.hostinger.com
  user: 'YOUR_HOSTINGER_DB_USER',       // e.g., u506903612_covia
  password: 'YOUR_HOSTINGER_DB_PASSWORD', // Your database password
  database: 'YOUR_HOSTINGER_DB_NAME'    // e.g., u506903612_covia
}
```

**Where to find these:**
1. Log in to Hostinger hPanel
2. Go to Databases → MySQL Databases
3. Copy the details from there

### Step 2: Commit and Push to Git

```bash
git add .
git commit -m "Add package.json for Hostinger deployment"
git push
```

### Step 3: Deploy via Hostinger Git

1. In Hostinger hPanel, go to Hosting → Deploy
2. Click "Import from Git"
3. Select your repository (Covia)
4. It will now detect `package.json` at the root
5. Click "Next" and follow the prompts

### Step 4: Set Up Database on Hostinger

1. In Hostinger hPanel, go to Databases → phpMyAdmin
2. Select your database
3. Click "SQL" tab
4. Paste this SQL and click "Go":

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  gender VARCHAR(20),
  photo_url TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firebase_uid ON users(firebase_uid);
```

### Step 5: Enable Node.js on Hostinger

1. In Hostinger hPanel, go to Hosting → Manage
2. Scroll to "Node.js" section
3. Click "Setup"
4. Fill in:
   - **Project root**: `/` (root of deployment)
   - **Application URL**: Your domain (e.g., `yourdomain.com`)
   - **Application startup file**: `backend/server.js`
   - **Application mode**: Production
5. Click "Create"

### Step 6: Add Domain to Firebase

1. Go to Firebase Console → Authentication → Sign-in method
2. Under "Authorized domains", add your domain (e.g., `yourdomain.com`)
3. Save

### Step 7: Test Your App

Open your browser and go to: `https://yourdomain.com`

---

## 📁 Method 2: Manual File Upload (Alternative)

If Git doesn't work, use this method:

### Step 1: Edit config.js (Same as above)

### Step 2: Set Up Database (Same as above)

### Step 3: Upload Files to Hostinger

Using Hostinger File Manager:
1. Go to Hostinger hPanel → Files → File Manager
2. Navigate to `public_html`
3. Upload all files and folders:
   - `backend/` folder
   - `css/` folder
   - `js/` folder
   - `images/` folder
   - All `.html` files
   - `package.json` (at root)
   - `.gitignore` (at root)

### Step 4: Enable Node.js (Same as above)

### Step 5: Add Domain to Firebase (Same as above)

---

## 📁 Final File Structure

```
public_html/
├── package.json                    (NEW - at root)
├── .gitignore                     (NEW - at root)
├── backend/
│   ├── config.js                  (EDIT THIS)
│   ├── server.js
│   ├── covia-926bb-firebase-adminsdk-fbsvc-cd0a35e2ba.json
│   ├── setup-database.js
│   └── (other backend files)
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── signin.js
│   ├── verify.js
│   ├── profile.js
│   └── ...
├── images/
│   └── hero.jpg
├── index.html
├── signin.html
├── verify.html
├── profile.html
└── ... (other HTML files)
```

## ❓ Troubleshooting

**Problem**: "Missing package.json" error
- **Solution**: I've added `package.json` at the root. Commit and push again.

**Problem**: Database connection fails
- **Solution**: Double-check the credentials in `backend/config.js`

**Problem**: App not loading
- **Solution**: Make sure Node.js is enabled in Hostinger hPanel

**Problem**: Firebase OTP not sending
- **Solution**: Add your domain to Firebase Console → Authentication → Sign-in method

**Problem**: reCAPTCHA error
- **Solution**: Add your domain to Firebase Console reCAPTCHA settings
