# 🚀 Supabase Google Authentication Setup

## ✅ Modal is Working!
The login modal now opens and closes properly. Next step is to set up Supabase Google authentication.

## 📋 What You Need to Do:

### **Step 1: Create Supabase Project**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (2-3 minutes)

### **Step 2: Get Your Supabase Credentials**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Anon public key** (long string starting with `eyJ...`)

### **Step 3: Enable Google OAuth**
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You'll need to set up Google OAuth credentials:

#### **Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or Google Identity API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**: 
   ```
   https://shyam-syangtan.github.io
   ```
7. **Authorized redirect URIs**:
   ```
   https://abcdefgh.supabase.co/auth/v1/callback
   ```
   (Replace `abcdefgh` with your actual Supabase project ID)

8. Copy the **Client ID** and **Client Secret**

#### **Back to Supabase:**
1. Paste the Google **Client ID** and **Client Secret** in Supabase
2. Set the redirect URL to: `https://shyam-syangtan.github.io/my-tutor-app/home.html`
3. Save the configuration

### **Step 4: Update Your Code**
1. Open `index.html` in your code editor
2. Find these lines (around line 180):
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
   ```
3. Replace with your actual values:
   ```javascript
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-actual-key...';
   ```

4. Do the same in `home.html` (around line 205)

### **Step 5: Deploy**
1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Add Supabase credentials"
   git push origin main
   npm run deploy
   ```

## 🧪 Testing the Authentication:

1. **Visit your site**: https://shyam-syangtan.github.io/my-tutor-app/
2. **Click "Log in"** - modal should open
3. **Click "Continue with Google"** - should redirect to Google OAuth
4. **Complete Google login** - should redirect back to your home page
5. **User should be logged in** and see their name/avatar

## 🚨 Troubleshooting:

**Error: "Authentication not configured"**
- Make sure you replaced the placeholder values with real Supabase credentials

**Error: "Invalid redirect URI"**
- Check that your Google OAuth redirect URIs match exactly
- Make sure you're using your actual Supabase project URL

**Error: "Provider not enabled"**
- Make sure Google OAuth is enabled in Supabase Authentication settings

**Login works but redirects to wrong page**
- Check the redirect URL in your Supabase Google provider settings

## 📞 Need Help?
If you run into issues, share:
1. Any error messages from the browser console
2. Your Supabase project URL (it's safe to share)
3. Screenshots of any error pages

The authentication flow should work like this:
**Landing Page** → **Click Login** → **Google OAuth** → **Home Page (Authenticated)**
