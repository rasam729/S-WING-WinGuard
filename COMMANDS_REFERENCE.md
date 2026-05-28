# WinGuard - Commands Reference

Quick reference for all commands used in the WinGuard project.

---

## 📦 Installation Commands

### Install All Dependencies
```bash
npm install
```

### Install with Legacy Peer Dependencies (if needed)
```bash
npm install --legacy-peer-deps
```

### Clean Install
```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf server/node_modules
npm install
```

---

## 🚀 Development Commands

### Start All Services
```bash
npm run dev
```

### Start Individual Services
```bash
# Backend only
npm run dev:server

# Citizen App only
npm run dev:citizen

# Official Dashboard only
npm run dev:official
```

---

## 🏗️ Build Commands

### Build All
```bash
npm run build
```

### Build Individual
```bash
# Backend
npm run build:server

# Citizen App
npm run build:citizen

# Official Dashboard
npm run build:official
```

---

## 🗄️ Database Commands

### Run Migrations
```bash
cd server
npm run migrate
```

### Create Test Users
```bash
cd server
npm run create-users
```

### Check Database Tables
```bash
cd server
npx ts-node src/scripts/checkTables.ts
```

### Run Schema Updates
```bash
cd server
npx ts-node src/scripts/runSchemaUpdates.ts
```

### Manual SQL Execution
```bash
# Using psql
psql $DATABASE_URL -f server/database/schema-updates-postgres.sql
psql $DATABASE_URL -f add-infrastructure-table.sql
psql $DATABASE_URL -f add-notifications-table.sql

# Or connect to database
psql $DATABASE_URL
```

---

## 🧪 Testing Commands

### Run All Tests
```bash
npm test
```

### Run Backend Tests
```bash
npm run test:server
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

---

## 🧹 Cleanup Commands

### Clean All
```bash
npm run clean
```

### Clean Node Modules
```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf server/node_modules
rm -rf shared/node_modules
```

### Clean Build Artifacts
```bash
rm -rf apps/citizen-app/dist
rm -rf apps/official-dashboard/dist
rm -rf server/dist
```

---

## 🔍 Linting Commands

### Lint All
```bash
npm run lint
```

### Lint and Fix
```bash
npm run lint -- --fix
```

---

## 📦 Package Management

### Add Dependency to Root
```bash
npm install <package-name>
```

### Add Dependency to Workspace
```bash
npm install <package-name> --workspace=server
npm install <package-name> --workspace=apps/citizen-app
npm install <package-name> --workspace=apps/official-dashboard
```

### Remove Dependency
```bash
npm uninstall <package-name>
npm uninstall <package-name> --workspace=server
```

### Update Dependencies
```bash
npm update
```

### Check Outdated Packages
```bash
npm outdated
```

---

## 🐳 Docker Commands (if using Docker)

### Build Images
```bash
npm run docker:build
```

### Start Containers
```bash
npm run docker:up
```

### Stop Containers
```bash
npm run docker:down
```

### View Logs
```bash
npm run docker:logs
```

---

## 🔧 Server-Specific Commands

### Start Server in Development
```bash
cd server
npm run dev
```

### Start Server in Production
```bash
cd server
npm run start
```

### Build Server
```bash
cd server
npm run build
```

### Run TypeScript Directly
```bash
cd server
npx ts-node src/index.ts
```

---

## 🎨 Frontend-Specific Commands

### Citizen App

```bash
cd apps/citizen-app

# Development
npm run dev

# Build
npm run build

# Preview Production Build
npm run preview

# Lint
npm run lint
```

### Official Dashboard

```bash
cd apps/official-dashboard

# Development
npm run dev

# Build
npm run build

# Preview Production Build
npm run preview

# Lint
npm run lint
```

---

## 🌐 Environment Commands

### Copy Environment Template
```bash
cp .env.example .env
```

### Edit Environment Variables
```bash
# Windows
notepad .env

# Linux/Mac
nano .env
# or
vim .env
```

---

## 📊 Database Backup & Restore

### Backup Database
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore Database
```bash
psql $DATABASE_URL < backup.sql
```

### Backup Specific Table
```bash
pg_dump $DATABASE_URL -t contractors > contractors_backup.sql
```

---

## 🔍 Debugging Commands

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

### Check TypeScript Version
```bash
npx tsc --version
```

### List Installed Packages
```bash
npm list
npm list --depth=0
```

### Check for Security Vulnerabilities
```bash
npm audit
npm audit fix
```

---

## 🚦 Process Management

### Kill Process on Port (Windows)
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Kill Process on Port (Linux/Mac)
```bash
lsof -ti:3000 | xargs kill -9
```

### Find Running Node Processes
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

---

## 📝 Git Commands

### Clone Repository
```bash
git clone <repository-url>
cd WinGuard
```

### Check Status
```bash
git status
```

### Add Changes
```bash
git add .
```

### Commit Changes
```bash
git commit -m "Your commit message"
```

### Push Changes
```bash
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### Create New Branch
```bash
git checkout -b feature/new-feature
```

---

## 🔐 Security Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Check for Vulnerabilities
```bash
npm audit
```

### Fix Vulnerabilities
```bash
npm audit fix
npm audit fix --force
```

---

## 📱 Mobile Build Commands (if using Capacitor)

### Sync with Native Projects
```bash
cd apps/citizen-app
npx cap sync
```

### Open Android Studio
```bash
npx cap open android
```

### Open Xcode
```bash
npx cap open ios
```

### Build Android APK
```bash
cd apps/citizen-app/android
./gradlew assembleDebug
```

---

## 🌍 Deployment Commands

### Deploy to Vercel
```bash
cd apps/citizen-app
vercel

cd ../official-dashboard
vercel
```

### Deploy to Netlify
```bash
cd apps/citizen-app
netlify deploy --prod

cd ../official-dashboard
netlify deploy --prod
```

### Deploy to Railway
```bash
railway login
railway init
railway up
```

### Deploy to Heroku
```bash
heroku create winguard-backend
heroku config:set DATABASE_URL=your-db-url
git push heroku main
```

---

## 📊 Performance Commands

### Analyze Bundle Size
```bash
cd apps/citizen-app
npm run build
npx vite-bundle-visualizer
```

### Check Build Size
```bash
cd apps/citizen-app
npm run build
du -sh dist
```

---

## 🔄 Update Commands

### Update All Dependencies
```bash
npm update
```

### Update Specific Package
```bash
npm update <package-name>
```

### Update npm Itself
```bash
npm install -g npm@latest
```

### Update Node.js (using nvm)
```bash
nvm install node
nvm use node
```

---

## 📚 Documentation Commands

### Generate API Documentation
```bash
# If using tools like Swagger
npm run docs:generate
```

### Serve Documentation Locally
```bash
# If using tools like Docusaurus
npm run docs:serve
```

---

## 🎯 Quick Start Commands

### Complete Setup from Scratch
```bash
# 1. Clone and install
git clone <repository-url>
cd WinGuard
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
cd server
npm run migrate
npm run create-users
cd ..

# 4. Start development
npm run dev
```

---

## 🆘 Troubleshooting Commands

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Reset Git Repository
```bash
git reset --hard HEAD
git clean -fd
```

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

---

## 📋 Useful Aliases (Optional)

Add these to your `.bashrc` or `.zshrc`:

```bash
# WinGuard aliases
alias wg-dev="npm run dev"
alias wg-build="npm run build"
alias wg-test="npm test"
alias wg-clean="npm run clean && npm install"
alias wg-server="npm run dev:server"
alias wg-citizen="npm run dev:citizen"
alias wg-official="npm run dev:official"
```

---

## 🔗 Quick Links

- **Citizen App**: http://localhost:5173
- **Official Dashboard**: http://localhost:5176
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

---

## 📞 Support Commands

### Check System Info
```bash
node --version
npm --version
git --version
psql --version
```

### Generate System Report
```bash
npm doctor
```

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0

---

## 💡 Pro Tips

1. Use `npm run dev` to start all services at once
2. Keep terminal windows organized (one per service)
3. Use `git status` frequently to track changes
4. Run `npm audit` regularly for security
5. Clear cache if you encounter weird errors
6. Use environment variables for sensitive data
7. Test locally before deploying
8. Keep dependencies updated
9. Use meaningful commit messages
10. Document any custom commands you add

---

**Happy Coding! 🚀**
