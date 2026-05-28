# WinGuard Deployment Guide

Complete guide for deploying WinGuard to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Database schema finalized
- [ ] Environment variables documented
- [ ] Security review completed
- [ ] Performance optimization done
- [ ] Backup strategy planned
- [ ] Monitoring tools selected
- [ ] Domain names registered
- [ ] SSL certificates obtained

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Citizen App   │ (Static hosting: Vercel/Netlify)
│   (React PWA)   │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   Backend API   │ (Node.js hosting: Railway/Heroku)
│  (Express.js)   │
└────────┬────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│   Database      │ (Neon Cloud / AWS RDS)
│  (PostgreSQL)   │
└─────────────────┘
```

---

## 🗄️ Database Deployment

### Option 1: Neon Cloud (Recommended)

**Advantages**:
- Serverless PostgreSQL
- Auto-scaling
- Built-in backups
- PostGIS support
- Free tier available

**Steps**:
1. Create production project at https://neon.tech
2. Enable PostGIS extension
3. Run migrations
4. Set up connection pooling
5. Configure backups

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Run schema
\i schema-updates-postgres.sql
\i add-infrastructure-table.sql
\i add-notifications-table.sql
```

### Option 2: AWS RDS

**Steps**:
1. Create RDS PostgreSQL instance
2. Enable PostGIS
3. Configure security groups
4. Set up automated backups
5. Enable Multi-AZ for high availability

### Option 3: Self-Hosted

**Requirements**:
- PostgreSQL 14+
- PostGIS 3+
- Regular backups
- Monitoring

---

## 🚀 Backend Deployment

### Option 1: Railway (Recommended)

**Advantages**:
- Easy deployment
- Auto-scaling
- Built-in monitoring
- Free tier available

**Steps**:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd server
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL=<your-neon-url>
   railway variables set JWT_SECRET=<your-secret>
   railway variables set NODE_ENV=production
   railway variables set CORS_ORIGIN=https://your-citizen-app.com,https://your-dashboard.com
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   ```bash
   railway domain
   ```

### Option 2: Heroku

**Steps**:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd server
   heroku create winguard-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=<your-db-url>
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 3: AWS EC2

**Steps**:

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Node.js and npm
3. Clone repository
4. Install dependencies
5. Set up PM2 for process management
6. Configure Nginx as reverse proxy
7. Set up SSL with Let's Encrypt

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name winguard-api

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## 🌐 Frontend Deployment

### Citizen App Deployment

#### Option 1: Vercel (Recommended)

**Steps**:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build App**
   ```bash
   cd apps/citizen-app
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment**
   - Add environment variables in Vercel dashboard
   - Set `VITE_API_URL` to your backend URL

#### Option 2: Netlify

**Steps**:

1. **Build App**
   ```bash
   cd apps/citizen-app
   npm run build
   ```

2. **Deploy via CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Or Deploy via Git**
   - Connect repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Official Dashboard Deployment

Same steps as Citizen App, but from `apps/official-dashboard` directory.

---

## 🔒 Security Configuration

### SSL/TLS Certificates

**Option 1: Let's Encrypt (Free)**
```bash
sudo certbot --nginx -d api.winguard.com
```

**Option 2: Cloudflare (Free)**
- Add domain to Cloudflare
- Enable SSL/TLS encryption
- Set to "Full (strict)" mode

### Environment Variables

**Production `.env`**:
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Server
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://citizen.winguard.com,https://dashboard.winguard.com

# API Keys
OPENROUTE_API_KEY=<your-key>

# Monitoring (optional)
SENTRY_DSN=<your-sentry-dsn>
```

### Security Headers

Add to Nginx configuration:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

---

## 📊 Monitoring & Logging

### Application Monitoring

**Option 1: Sentry**

```bash
npm install @sentry/node
```

```typescript
// server/src/server.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Option 2: New Relic**

```bash
npm install newrelic
```

### Database Monitoring

- Enable slow query logging
- Set up connection pool monitoring
- Monitor disk usage
- Track query performance

### Uptime Monitoring

**Services**:
- UptimeRobot (free)
- Pingdom
- StatusCake

**Setup**:
1. Add health check endpoint monitoring
2. Set up alerts for downtime
3. Monitor response times
4. Track SSL certificate expiry

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build:server
      - run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build:citizen
      - run: npm run build:official
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 💾 Backup Strategy

### Database Backups

**Automated Backups**:
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://winguard-backups/
```

**Backup Schedule**:
- Daily automated backups
- Weekly full backups
- Monthly archives
- Retention: 30 days daily, 12 months monthly

### File Backups

- User uploaded photos
- Configuration files
- SSL certificates

---

## 🚦 Load Balancing

### Nginx Configuration

```nginx
upstream backend {
    server backend1.winguard.com:3000;
    server backend2.winguard.com:3000;
    server backend3.winguard.com:3000;
}

server {
    listen 443 ssl http2;
    server_name api.winguard.com;

    ssl_certificate /etc/letsencrypt/live/api.winguard.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.winguard.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

**Backend**:
- Multiple server instances
- Load balancer distribution
- Session management with Redis

**Database**:
- Read replicas for queries
- Connection pooling
- Query optimization

### Vertical Scaling

**When to scale up**:
- CPU usage > 70%
- Memory usage > 80%
- Response time > 500ms
- Database connections maxed

---

## 🔍 Performance Optimization

### Frontend

1. **Code Splitting**
   ```typescript
   const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
   ```

2. **Image Optimization**
   - Compress images
   - Use WebP format
   - Lazy load images

3. **Caching**
   - Service worker caching
   - Browser caching headers
   - CDN for static assets

### Backend

1. **Database Optimization**
   - Add indexes
   - Optimize queries
   - Use connection pooling

2. **API Optimization**
   - Response compression
   - Rate limiting
   - Caching with Redis

3. **Asset Delivery**
   - Use CDN for uploads
   - Compress responses
   - Enable HTTP/2

---

## 🧪 Production Testing

### Pre-Launch Checklist

- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup restoration tested
- [ ] Monitoring alerts configured
- [ ] SSL certificates valid
- [ ] DNS configured correctly
- [ ] Error tracking working
- [ ] Performance benchmarks met

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 https://api.winguard.com/health

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" https://api.winguard.com/api/reports
```

---

## 📱 Mobile App Deployment

### Android

1. **Build APK**
   ```bash
   cd apps/citizen-app
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

2. **Sign APK**
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
     -keystore my-release-key.keystore \
     app-release-unsigned.apk alias_name
   ```

3. **Upload to Play Store**
   - Create Play Console account
   - Upload APK
   - Fill store listing
   - Submit for review

### iOS

1. **Build IPA**
   ```bash
   cd apps/citizen-app
   npx cap sync ios
   cd ios/App
   xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
   ```

2. **Upload to App Store**
   - Use Xcode or Transporter
   - Submit for review

---

## 🎯 Post-Deployment

### Monitoring Checklist

- [ ] Application logs reviewed
- [ ] Error rates acceptable
- [ ] Response times good
- [ ] Database performance good
- [ ] SSL certificates valid
- [ ] Backups running
- [ ] Alerts configured
- [ ] Users can access

### Maintenance Plan

**Daily**:
- Check error logs
- Monitor uptime
- Review performance metrics

**Weekly**:
- Review security logs
- Check backup integrity
- Update dependencies

**Monthly**:
- Security audit
- Performance review
- Capacity planning
- Cost optimization

---

## 🆘 Rollback Plan

### Quick Rollback

```bash
# Revert to previous deployment
railway rollback

# Or with Vercel
vercel rollback
```

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

### Emergency Contacts

- Database Admin: ___________
- DevOps Lead: ___________
- Security Team: ___________
- On-Call Engineer: ___________

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] SSL certificates obtained
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Deployment
- [ ] Database deployed
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] DNS configured
- [ ] SSL enabled
- [ ] Monitoring active

### Post-Deployment
- [ ] Health checks passing
- [ ] All features working
- [ ] Performance acceptable
- [ ] Backups running
- [ ] Team notified
- [ ] Documentation updated

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Environment**: [ ] Staging [ ] Production
**Status**: [ ] Success [ ] Failed
**Notes**: _____________

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0
