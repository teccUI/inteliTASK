# IntelliTask Deployment Checklist

## 🚀 Pre-Deployment Checklist

### ✅ Environment Variables
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `NEXTAUTH_SECRET` - 72502f0e2758434c73f483885dc82acf ✅
- [ ] `NEXTAUTH_URL` - Your production URL
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID ✅
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret ✅
- [ ] `NEXT_PUBLIC_VAPID_KEY` - BGvbeP0bAS4e7qmiRCVxrYoNhIy2m78-bVygHwpM3TnhPip2YxeuZhLnI35-ALECwhG3TQ6mEUFDEMb0YV-K9x0 ✅
- [ ] All Firebase environment variables ✅

### ✅ Firebase Configuration
- [ ] Firebase project created ✅
- [ ] Authentication enabled (Email/Password + Google) ✅
- [ ] Firestore database enabled ✅
- [ ] Cloud Messaging enabled ✅
- [ ] VAPID keys generated ✅
- [ ] Firebase Admin SDK key uploaded ✅

### ✅ Google Cloud Platform
- [ ] GCP project created ✅
- [ ] Google Calendar API enabled ✅
- [ ] OAuth 2.0 credentials created ✅
- [ ] Authorized redirect URIs configured
- [ ] Authorized JavaScript origins configured

### ✅ MongoDB
- [ ] MongoDB Atlas cluster created ✅
- [ ] Database user created ✅
- [ ] Network access configured ✅
- [ ] Connection string obtained ✅

## 🔧 Integration Tests

Run the integration tests to verify all systems:

1. Visit `/integrations` in your application
2. Click "Run Tests" to verify all integrations
3. Ensure all tests pass before deployment

## 🚀 Deployment Steps

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Build and Deploy**
   \`\`\`bash
   npm run build
   vercel --prod
   \`\`\`

3. **Configure Environment Variables in Vercel**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all environment variables from your .env.local

4. **Update OAuth Redirect URIs**
   - Add your production domain to Google OAuth settings
   - Update Firebase Auth authorized domains

### Other Platforms

The application can be deployed to:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📋 Post-Deployment Checklist

- [ ] Visit `/integrations` to run integration tests
- [ ] Test user registration and login
- [ ] Test Google OAuth login
- [ ] Test task creation and management
- [ ] Test Google Calendar sync
- [ ] Test push notifications
- [ ] Verify all API endpoints are working

## 🔍 Monitoring

- Monitor application health at `/setup`
- Check integration status at `/integrations`
- Monitor Firebase Console for authentication metrics
- Monitor MongoDB Atlas for database performance

## 🆘 Troubleshooting

### Common Issues:

1. **OAuth Redirect Mismatch**
   - Ensure production URLs are added to Google OAuth settings
   - Update NEXTAUTH_URL to production domain

2. **Firebase Domain Authorization**
   - Add production domain to Firebase Auth authorized domains

3. **MongoDB Connection**
   - Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
   - Or add Vercel's IP ranges to whitelist

4. **Environment Variables**
   - Ensure all environment variables are set in production
   - Restart deployment after adding variables

## 📊 Performance Optimization

- Enable Vercel Analytics
- Configure MongoDB connection pooling
- Implement Redis caching for frequent queries
- Optimize images and assets
- Enable compression and caching headers

---

Your IntelliTask application is now ready for production deployment! 🎉
