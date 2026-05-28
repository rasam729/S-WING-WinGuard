# WinGuard - Frequently Asked Questions (FAQ)

Common questions and answers about the WinGuard Urban Safety Platform.

---

## 📋 General Questions

### What is WinGuard?

WinGuard is a comprehensive urban safety platform that connects citizens with city officials through real-time reporting and digital twin simulation. It allows citizens to report infrastructure issues (potholes, broken streetlights, etc.) and enables officials to manage, track, and resolve these issues efficiently.

### Who is WinGuard for?

- **Citizens**: Report issues, track status, find safe routes
- **City Officials**: Manage reports, track budgets, assign contractors
- **Engineers**: Receive assignments, manage workload
- **Contractors**: Get work assignments, track projects
- **City Administrators**: View analytics, manage resources

### What features does WinGuard include?

All 8 core features are fully implemented:
1. Contractor Information & Contact Management
2. Allocated Budgets & Transparency
3. Maintenance Schedules & Repair History
4. Global Map Extension (Leaflet.js Worldwide)
5. Complaint Routing Mechanism
6. Offline Functionality & Low-Network Support
7. Budget Transparency with Source Tracking
8. Executive Engineer Assignment System

Plus: Analytics, Notifications, Safety Scores, and more!

---

## 🚀 Installation & Setup

### What are the system requirements?

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL**: v14+ with PostGIS extension
- **Operating System**: Windows, macOS, or Linux
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

### How long does installation take?

- **Quick Setup**: 5-10 minutes (if you have prerequisites)
- **Full Setup**: 15-30 minutes (including database setup)
- **First Time**: 30-60 minutes (including learning)

### Do I need a database?

Yes, WinGuard requires PostgreSQL with PostGIS extension. We recommend:
- **Neon Cloud** (easiest, free tier available)
- **AWS RDS** (production-ready)
- **Local PostgreSQL** (for development)

### Can I use a different database?

The application is built specifically for PostgreSQL with PostGIS for spatial data. Using a different database would require significant code changes.

### What if I don't have a database?

Sign up for a free Neon Cloud account at https://neon.tech/ - it takes 2 minutes and includes PostGIS support.

---

## 💻 Development

### How do I start the development servers?

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:server    # Backend (port 3000)
npm run dev:citizen   # Citizen App (port 5173)
npm run dev:official  # Dashboard (port 5176)
```

### What ports does WinGuard use?

- **Backend API**: 3000
- **Citizen App**: 5173
- **Official Dashboard**: 5176

### Can I change the ports?

Yes, you can configure ports in:
- Backend: `.env` file (`PORT=3000`)
- Frontend: `vite.config.ts` files

### How do I access the applications?

- **Citizen App**: http://localhost:5173
- **Official Dashboard**: http://localhost:5176
- **API Health Check**: http://localhost:3000/health

### What are the demo credentials?

**Citizen Account**:
- Email: `citizen@winguard.com`
- Password: `citizen123`

**Official Account**:
- Email: `official@bengaluru.gov.in`
- Password: `official123`

---

## 🗺️ Map & Location

### Does WinGuard work worldwide?

Yes! The map supports any location worldwide. While the default view is India, you can search for and use any location globally.

### How do I change the default map location?

Edit `DashboardPage.tsx`:
```typescript
const mapCenter: [number, number] = [YOUR_LAT, YOUR_LON];
const mapZoom = YOUR_ZOOM_LEVEL;
```

### Can I use Google Maps instead of OpenStreetMap?

Yes, but you'll need to:
1. Get a Google Maps API key
2. Replace Leaflet.js with Google Maps API
3. Update all map components

OpenStreetMap is free and doesn't require an API key.

### How does the search feature work?

The search uses Nominatim (OpenStreetMap's geocoding service) to find locations. It's free and works worldwide without an API key.

### Why isn't my location showing up in search?

- Check your internet connection
- Try different search terms
- Add more context (e.g., "Mumbai, India" instead of just "Mumbai")
- The location might not be in OpenStreetMap database

---

## 📊 Features

### How do I access the Analytics page?

1. Login to Official Dashboard
2. Click "📊 Analytics" in the sidebar
3. Select time range (7, 30, 90, 365 days)

### How do I track budgets?

1. Login to Official Dashboard
2. Click "💰 Budget" in the sidebar
3. View Overview, Allocations, Expenses, or Transparency tabs

### How do I manage contractors?

1. Login to Official Dashboard
2. Click "🏗️ Contractors" in the sidebar
3. Search, filter, or click a contractor for details

### How do I schedule maintenance?

1. Login to Official Dashboard
2. Click "🔧 Maintenance" in the sidebar
3. View schedules, create new, or mark as complete

### How do I assign engineers?

1. Login to Official Dashboard
2. Click "👷 Engineers" in the sidebar
3. View engineers and their workload
4. Assign issues manually or use auto-assignment

### How does auto-assignment work?

The system uses routing rules based on:
- Issue category
- Severity level
- Ward/zone
- Road type
- Engineer availability
- Current workload

---

## 🔒 Security

### Is WinGuard secure?

Yes, WinGuard includes:
- JWT authentication
- Password hashing (bcrypt)
- CORS protection
- SQL injection protection
- XSS protection
- Rate limiting
- Secure headers (Helmet.js)

### How are passwords stored?

Passwords are hashed using bcrypt before storage. Plain text passwords are never stored.

### Can I use OAuth/Social Login?

Not currently implemented, but you can add:
- Google OAuth
- Facebook Login
- GitHub OAuth

### How long do sessions last?

JWT tokens expire after 7 days by default. You can change this in `.env`:
```env
JWT_EXPIRES_IN=7d
```

### What if I forget my password?

Password reset is not currently implemented. You can:
1. Reset via database directly
2. Implement password reset feature
3. Contact administrator

---

## 📱 Mobile & PWA

### Does WinGuard work on mobile?

Yes! The Citizen App is a Progressive Web App (PWA) that works on:
- iOS (Safari)
- Android (Chrome)
- Any mobile browser

### Can I install it as an app?

Yes! On mobile browsers:
1. Open the Citizen App
2. Look for "Add to Home Screen" prompt
3. Install
4. Use like a native app

### Does it work offline?

Yes! The PWA includes:
- Offline caching
- Background sync
- Cached map tiles
- Queue reports for later submission

### How do I build native apps?

For Android/iOS apps:
```bash
cd apps/citizen-app
npx cap add android
npx cap add ios
npx cap sync
```

Then open in Android Studio or Xcode.

---

## 🐛 Troubleshooting

### "Cannot connect to database"

**Solutions**:
1. Check DATABASE_URL in `.env`
2. Verify database exists
3. Check PostGIS extension is installed
4. Test connection: `psql $DATABASE_URL`

### "Port already in use"

**Solutions**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
```

### "Module not found"

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Or specific workspace
cd server
npm install
```

### "Chart.js not working"

**Solution**:
```bash
cd apps/official-dashboard
npm install chart.js react-chartjs-2
```

### "CORS errors"

**Solution**:
1. Check CORS_ORIGIN in `.env`
2. Include all frontend URLs
3. Restart backend server

### "TypeScript errors"

**Solutions**:
```bash
# Rebuild
npm run build

# Or specific workspace
cd server
npm run build
```

### "Map not loading"

**Solutions**:
1. Check internet connection
2. Clear browser cache
3. Check console for errors
4. Verify Leaflet.js is loaded

### "Images not uploading"

**Solutions**:
1. Check file size (max 5MB)
2. Check file type (jpg, png, gif)
3. Verify uploads directory exists
4. Check disk space

---

## 🚀 Deployment

### Can I deploy WinGuard for free?

Yes! Free tier options:
- **Database**: Neon Cloud (free tier)
- **Backend**: Railway (free tier)
- **Frontend**: Vercel/Netlify (free tier)

### What's the recommended deployment?

**Production Setup**:
- **Database**: Neon Cloud or AWS RDS
- **Backend**: Railway or Heroku
- **Frontend**: Vercel or Netlify
- **Monitoring**: Sentry (free tier)

### How do I deploy to production?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions.

### Do I need a domain name?

Not required, but recommended for production:
- Backend: api.yourdomain.com
- Citizen App: app.yourdomain.com
- Dashboard: dashboard.yourdomain.com

### How do I set up SSL?

**Options**:
1. **Let's Encrypt** (free): `certbot --nginx`
2. **Cloudflare** (free): Enable SSL in dashboard
3. **Hosting Provider**: Usually included

### What about scaling?

WinGuard can scale:
- **Horizontally**: Multiple server instances
- **Vertically**: Larger server resources
- **Database**: Read replicas, connection pooling

---

## 💰 Cost

### Is WinGuard free?

Yes! WinGuard is open source. You only pay for:
- Hosting services (many have free tiers)
- Domain name (optional, ~$10/year)
- SSL certificate (free with Let's Encrypt)

### What are the hosting costs?

**Free Tier** (suitable for testing):
- Database: Neon Cloud (free)
- Backend: Railway (free)
- Frontend: Vercel (free)
- **Total**: $0/month

**Production** (recommended):
- Database: Neon Cloud ($19/month)
- Backend: Railway ($5-20/month)
- Frontend: Vercel ($0-20/month)
- **Total**: $24-59/month

### Can I self-host?

Yes! You can host on your own servers:
- VPS (DigitalOcean, Linode): $5-20/month
- AWS EC2: $10-50/month
- On-premises: Hardware costs only

---

## 🔧 Customization

### Can I customize WinGuard?

Yes! You can customize:
- Branding and colors
- Map center and zoom
- Issue categories
- Languages
- Features
- UI/UX

### How do I change colors?

Edit Tailwind config:
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

### How do I add new issue categories?

1. Update database enum
2. Add to frontend dropdown
3. Update routing rules
4. Add icons/colors

### Can I add multiple languages?

Yes! Implement i18n:
```bash
npm install react-i18next i18next
```

Then add translation files.

### How do I change the logo?

Replace:
- `/public/WinGuard_Logo.png`
- Update references in components

---

## 📊 Data & Analytics

### How is data stored?

- **Database**: PostgreSQL with PostGIS
- **Files**: Local filesystem or cloud storage
- **Cache**: Service worker cache
- **Sessions**: JWT tokens

### Can I export data?

Yes! You can:
- Export via API endpoints
- Direct database queries
- CSV export (implement custom)
- PDF reports (implement custom)

### How do I backup data?

**Automated**:
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Neon Cloud**: Automatic backups included

### Can I import existing data?

Yes! Create SQL scripts or use API endpoints to import data.

### How do I view analytics?

1. Login to Official Dashboard
2. Click "📊 Analytics"
3. Select time range
4. View charts and metrics

---

## 🤝 Integration

### Can I integrate with other systems?

Yes! WinGuard provides:
- REST API (50+ endpoints)
- WebSocket for real-time
- Webhooks (implement custom)
- Database access

### How do I integrate with GIS systems?

WinGuard uses PostGIS, which is compatible with:
- QGIS
- ArcGIS
- MapInfo
- Other GIS tools

### Can I connect to existing databases?

Yes, but you'll need to:
1. Map your schema to WinGuard's
2. Create migration scripts
3. Update API endpoints

### Does it have an API?

Yes! See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete reference.

---

## 📚 Documentation

### Where is the documentation?

All documentation is in the repository:
- README.md - Overview
- QUICKSTART.md - Quick setup
- INSTALLATION_GUIDE.md - Detailed setup
- API_DOCUMENTATION.md - API reference
- FEATURES_IMPLEMENTATION.md - Features
- DEPLOYMENT_GUIDE.md - Deployment
- DOCUMENTATION_INDEX.md - All docs

### Is there video documentation?

Not currently, but you can create:
- Installation walkthrough
- Feature demonstrations
- Tutorial series

### Can I contribute to documentation?

Yes! Documentation improvements are welcome.

---

## 🆘 Support

### Where can I get help?

1. Check this FAQ
2. Read relevant documentation
3. Check troubleshooting sections
4. Review error messages
5. Search issues on GitHub

### How do I report bugs?

1. Check if it's a known issue
2. Gather error messages
3. Note steps to reproduce
4. Create detailed bug report

### Can I request features?

Yes! Feature requests are welcome. Provide:
- Clear description
- Use case
- Expected behavior
- Priority level

### Is there a community?

You can create:
- Discord server
- Slack workspace
- Forum
- Mailing list

---

## 🎯 Best Practices

### What are the recommended practices?

**Development**:
- Use TypeScript
- Write tests
- Follow code style
- Document changes

**Security**:
- Use strong passwords
- Enable SSL
- Regular updates
- Monitor logs

**Performance**:
- Optimize images
- Use caching
- Monitor metrics
- Scale as needed

**Maintenance**:
- Regular backups
- Update dependencies
- Monitor errors
- Review logs

---

## 📈 Performance

### How fast is WinGuard?

**Typical Performance**:
- Page load: < 2 seconds
- API response: < 500ms
- Map render: < 1 second
- Search: < 1 second

### How can I improve performance?

1. Enable caching
2. Use CDN
3. Optimize images
4. Add database indexes
5. Use connection pooling

### What's the maximum capacity?

Depends on hosting, but can handle:
- 10,000+ users
- 100,000+ reports
- 1,000+ concurrent users

With proper scaling, much more.

---

## ✅ Checklist

### Pre-Installation
- [ ] Node.js installed
- [ ] Database ready
- [ ] Prerequisites met

### Installation
- [ ] Dependencies installed
- [ ] Database configured
- [ ] Environment variables set
- [ ] Migrations run

### Verification
- [ ] All services start
- [ ] Can login
- [ ] Features work
- [ ] No errors

### Production
- [ ] SSL enabled
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Documentation reviewed

---

## 📞 Quick Links

- [Installation Guide](./INSTALLATION_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Features List](./FEATURES_IMPLEMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Verification Checklist](./VERIFICATION_CHECKLIST.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0
**Questions Not Answered?** Check the documentation or create an issue.
