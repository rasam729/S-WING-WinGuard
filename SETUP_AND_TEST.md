# 🚀 Setup and Test Guide

## Step 1: Configure Database

1. Open this file: `server\.env`
2. Find this line:
   ```
   DB_PASSWORD=postgres
   ```
3. Change `postgres` to your actual PostgreSQL password
4. Save the file

## Step 2: Create Database

Open your PostgreSQL command line (pgAdmin or psql) and run:

```sql
CREATE DATABASE winguard;
```

Or if you prefer, run this command in PowerShell:
```powershell
# Replace 'your_password' with your actual password
$env:PGPASSWORD='your_password'; psql -U postgres -c "CREATE DATABASE winguard;"
```

## Step 3: Start the Servers

Open PowerShell in your project folder and run:

```powershell
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Citizen app on http://localhost:5174

## Step 4: Test the Features

### Open the App
Go to: **http://localhost:5174**

### Test 1: Sign Up (Skip if you have account)
1. Click "Sign Up"
2. Fill in your details
3. Click "Sign Up" button

### Test 2: Login
1. Enter your email and password
2. Click "Sign In"

### Test 3: Report Issue (This is where the new features are!)
1. Click the "Report Issue" button (usually a + button)
2. You'll see the enhanced form

### Test 4: Keyword Triage ✨
1. In the **"Brief Description"** field, type: `"There is a big pothole here"`
2. **Watch the "Issue Category" dropdown** - it should auto-change to "Pothole"
3. Clear and type: `"The streetlight is broken"` - should change to "Broken Streetlight"

### Test 5: GPS Extraction 📍
1. Click the photo upload area
2. Upload a photo from your phone (one with location data)
3. **Look for:**
   - Green box saying "GPS EXTRACTED" with coordinates
   - OR blue message saying "No GPS data found"

### Test 6: Submit
1. Fill all required fields
2. Click "Submit Report"
3. You should see success message!

---

## ✅ What You're Testing

The features I integrated:

1. **EXIF GPS Extraction** - Automatically extracts GPS coordinates from photos
2. **Keyword Triage** - Auto-detects issue category from description text
3. **Better Error Handling** - Clear error messages if backend is down

---

## 🐛 Troubleshooting

### "Backend server is not running" error
- Make sure you ran `npm run dev`
- Check that port 3000 is not in use
- Verify your `.env` file has correct database password

### "Database connection failed"
- Make sure PostgreSQL is running
- Check your database password in `server\.env`
- Make sure database `winguard` exists

### Can't see the form
- Make sure you're logged in
- Click the "Report Issue" button (+ icon)

---

## 📝 Once Everything Works

Tell me: **"Everything works! Ready to push!"**

And I'll help you commit and push all changes to GitHub.
