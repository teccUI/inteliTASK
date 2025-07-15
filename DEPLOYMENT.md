# Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Google Cloud Console project set up
- [ ] Service account keys generated
- [ ] OAuth credentials created

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Build completes successfully
- [ ] Health check endpoint returns healthy status
- [ ] Integration tests pass

### Security
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly secured
- [ ] Firebase security rules configured
- [ ] CORS settings configured
- [ ] Rate limiting implemented (if needed)

## Deployment Steps

### Vercel Deployment
1. [ ] Connect GitHub repository to Vercel
2. [ ] Configure environment variables in Vercel dashboard
3. [ ] Set up custom domain (if applicable)
4. [ ] Configure deployment settings
5. [ ] Deploy to production

### Post-Deployment Verification
- [ ] Application loads successfully
- [ ] Authentication works (email/password and Google)
- [ ] Task creation and management functions
- [ ] Calendar integration works
- [ ] Push notifications work
- [ ] All API endpoints respond correctly
- [ ] Health check returns healthy status
- [ ] Error handling works properly

## Environment Variables Checklist

### Firebase Configuration
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`

### Google OAuth
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### NextAuth
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`

### Push Notifications
- [ ] `NEXT_PUBLIC_VAPID_KEY`

## Monitoring

### Health Checks
- [ ] Set up monitoring for `/api/health` endpoint
- [ ] Configure alerts for service degradation
- [ ] Monitor Firebase usage and quotas
- [ ] Track API response times

### Analytics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor user engagement
- [ ] Track feature usage
- [ ] Monitor performance metrics

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Monitor Firebase costs
- [ ] Review error logs weekly
- [ ] Update documentation as needed

### Backup Strategy
- [ ] Firebase automatic backups enabled
- [ ] Export user data regularly
- [ ] Document recovery procedures
- [ ] Test backup restoration process

## Troubleshooting

### Common Issues
- **Firebase connection errors**: Check service account configuration
- **Authentication failures**: Verify OAuth settings and domains
- **API errors**: Check environment variables and Firebase rules
- **Build failures**: Ensure all dependencies are properly installed
- **Calendar sync issues**: Verify Google Cloud Console settings

### Debug Commands
\`\`\`bash
# Check health status
curl https://your-domain.com/api/health

# Test integrations
curl -X POST https://your-domain.com/api/integrations/test

# Check build
pnpm build

# Run locally
pnpm dev
