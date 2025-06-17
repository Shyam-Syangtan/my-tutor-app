# Next.js Tutor Marketplace - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Next.js version of the tutor marketplace application to Vercel with proper GitHub integration.

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project (already configured)

## 1. GitHub Repository Setup

### Option A: Create New Repository
1. Go to GitHub and create a new repository
2. Name it `tutor-marketplace-nextjs`
3. Initialize with README (optional)

### Option B: Use Existing Repository
1. Navigate to your existing repository
2. Create a new branch for the Next.js version:
   ```bash
   git checkout -b nextjs-version
   ```

## 2. Push Next.js Code to GitHub

1. Navigate to the nextjs-version directory:
   ```bash
   cd nextjs-version
   ```

2. Initialize git (if new repo):
   ```bash
   git init
   git add .
   git commit -m "Initial Next.js implementation"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tutor-marketplace-nextjs.git
   git push -u origin main
   ```

3. Or push to existing repo branch:
   ```bash
   git add .
   git commit -m "Add Next.js version"
   git push origin nextjs-version
   ```

## 3. Vercel Deployment Setup

### Step 1: Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your repository

### Step 2: Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `nextjs-version` (if using subdirectory)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Environment Variables
Add the following environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://qbyyutebrgpxngvwenkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## 4. Supabase Configuration Updates

### Update OAuth Redirect URLs
1. Go to your Supabase dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel domain to Site URL and Redirect URLs:
   - Site URL: `https://your-project-name.vercel.app`
   - Redirect URLs: `https://your-project-name.vercel.app/auth/callback`

## 5. Custom Domain (Optional)

### Using Vercel Domains
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Follow DNS configuration instructions

### Update Supabase URLs
After setting up custom domain, update Supabase redirect URLs to use your custom domain.

## 6. Automatic Deployments

Vercel automatically deploys when you push to your main branch. For development:

1. **Production**: Push to `main` branch
2. **Preview**: Push to any other branch (creates preview deployment)

## 7. Monitoring and Analytics

### Vercel Analytics
1. Enable Vercel Analytics in your project dashboard
2. Add analytics to your app (optional)

### Error Monitoring
Consider integrating:
- Sentry for error tracking
- Vercel's built-in monitoring

## 8. Performance Optimization

### Image Optimization
- Replace `<img>` tags with Next.js `<Image>` component
- Configure image domains in `next.config.js`

### Bundle Analysis
```bash
npm install @next/bundle-analyzer
```

## 9. Security Considerations

### Environment Variables
- Never commit `.env.local` to git
- Use Vercel's environment variable management
- Rotate Supabase keys if needed

### CORS Configuration
Ensure Supabase CORS settings allow your Vercel domain.

## 10. Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required vars are set
3. **Supabase Connection**: Verify URLs and keys
4. **OAuth Issues**: Check redirect URL configuration

### Build Commands
If build fails, try:
```bash
npm run build
npm run start
```

## 11. Maintenance

### Regular Updates
1. Keep dependencies updated
2. Monitor Vercel usage limits
3. Review Supabase usage
4. Update security patches

### Backup Strategy
1. Regular database backups via Supabase
2. Code versioning via Git
3. Environment variable documentation

## Support

For issues:
1. Check Vercel documentation
2. Review Next.js deployment guides
3. Supabase authentication docs
4. GitHub repository issues

## Next Steps

After successful deployment:
1. Test all functionality
2. Set up monitoring
3. Configure custom domain
4. Implement additional features
5. Set up CI/CD pipeline (optional)
