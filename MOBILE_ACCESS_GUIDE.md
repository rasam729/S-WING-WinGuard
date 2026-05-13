# 📱 WinGuard Mobile Access Guide

## Quick Access

### 🌐 Access URLs

**On Your Computer:**
```
http://localhost:5173
```

**On Your Mobile Phone (Same WiFi Network):**
```
http://172.17.0.79:5173
```

---

## 📋 Setup Instructions

### Step 1: Ensure Servers are Running

Make sure both servers are running on your computer:

**Backend Server (Port 3000):**
```bash
cd server
npm run dev
```

**Frontend Server (Port 5173):**
```bash
cd apps/citizen-app
npm run dev
```

### Step 2: Connect Mobile to Same WiFi

- Ensure your mobile phone is connected to the **same WiFi network** as your computer
- Both devices must be on the same local network

### Step 3: Open on Mobile

1. Open your mobile browser (Chrome, Safari, Firefox, etc.)
2. Enter the URL: `http://172.17.0.79:5173`
3. The WinGuard app should load

---

## 🎯 Guardian Path Navigator Features

### 1. Route Planning
- Click the **compass icon** (🧭) in the top header
- Enter starting location (or use "Current Location" button)
- Enter destination coordinates
- Click "Find Safe Routes"

### 2. Route Selection
Two route options will appear:
- **Guardian Path** (Green) - Maximum safety, avoids all hazards
- **Alternative Route** (Blue) - Faster but less safe

Each route shows:
- 📍 Distance in kilometers
- ⏱️ Estimated time in minutes
- 🛡️ Safety score (0-100)
- ⚠️ Number of hazards near route

### 3. Start Navigation
- Select your preferred route
- Click "Start Navigation"
- Turn-by-turn directions will appear
- Voice instructions will speak automatically

### 4. Navigation Controls
- **🔊 Speaker Icon**: Replay current instruction
- **⬅️ Previous**: Go to previous step
- **➡️ Next**: Go to next step
- **Stop**: End navigation

---

## 🗺️ Map Features

### Visual Elements
- **Green Line**: Guardian Path (safest route)
- **Blue Line**: Alternative route
- **Colored Circles**: Safety indicators along route
  - 🟢 Green: Safe (70-100 score)
  - 🟠 Orange: Moderate (40-69 score)
  - 🔴 Red: Caution (0-39 score)

### Markers
- **Blue Dot**: Your current location
- **Green Pin**: Starting point
- **Red Target**: Destination

---

## 🤖 Viosa AI Assistant

### Access Viosa
- Click the **purple floating button** (bottom-right)
- Viosa can help you:
  - Find safe routes
  - Show nearby hazards
  - Provide safety statistics
  - Give emergency contacts

### Example Commands
- "Find safe route"
- "Show nearby hazards"
- "Safety statistics"
- "Emergency help"

---

## 📊 Demo Credentials

### Citizen Account
```
Email: citizen@winguard.com
Password: citizen123
```

### Official Dashboard
```
Email: official@bengaluru.gov.in
Password: official123
```

---

## 🎤 Text-to-Speech

### Voice Navigation
- Automatic voice instructions during navigation
- Speaks each turn and direction
- Adjustable speed and volume (in browser settings)

### Supported Browsers
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Edge (Android)

---

## 🔧 Troubleshooting

### Can't Access on Mobile?

**Check 1: Same WiFi Network**
- Verify both devices are on the same WiFi
- Check WiFi name on both devices

**Check 2: Firewall Settings**
- Windows Firewall might block the connection
- Temporarily disable firewall or add exception for port 5173

**Check 3: Server Running**
- Ensure `npm run dev` is running in citizen-app folder
- Check terminal for "Local: http://localhost:5173"

**Check 4: Try Alternative IP**
If `172.17.0.79` doesn't work, try:
```
http://172.26.80.1:5173
```

### Voice Not Working?

**Solution 1: Browser Permissions**
- Allow microphone/audio permissions
- Check browser settings

**Solution 2: Volume**
- Increase device volume
- Check browser audio settings

**Solution 3: Browser Support**
- Use Chrome or Safari for best results
- Update browser to latest version

### Route Not Calculating?

**Solution 1: Location Services**
- Enable GPS/location services
- Allow browser location access

**Solution 2: Valid Coordinates**
- Use format: `12.9716, 77.5946`
- Ensure coordinates are in Bengaluru area

**Solution 3: Backend Connection**
- Check backend server is running
- Verify no errors in terminal

---

## 📍 Sample Locations (Bengaluru)

### Popular Destinations

**MG Road:**
```
12.9759, 77.6061
```

**Koramangala:**
```
12.9350, 77.6200
```

**Indiranagar:**
```
12.9716, 77.6412
```

**Whitefield:**
```
12.9550, 77.6100
```

**HSR Layout:**
```
12.9500, 77.6000
```

**Jayanagar:**
```
12.9700, 77.6200
```

---

## 🚀 Quick Start Example

### Complete Navigation Flow

1. **Open App**
   - Go to `http://172.17.0.79:5173` on mobile
   - Login with citizen credentials

2. **Enable Location**
   - Click "My Location" button (blue dot icon)
   - Allow location access

3. **Plan Route**
   - Click compass icon (🧭) in header
   - Click "Use Current Location" for start
   - Enter destination: `12.9350, 77.6200`
   - Click "Find Safe Routes"

4. **Select Route**
   - Review Guardian Path (green) and Alternative (blue)
   - Compare safety scores and times
   - Click on preferred route

5. **Start Navigation**
   - Click "Start Navigation" button
   - Listen to voice instructions
   - Follow turn-by-turn directions
   - Use Next/Previous to navigate steps

6. **Arrive**
   - Final instruction: "You have arrived at your destination"
   - Click "Stop" to end navigation

---

## 🎨 UI Features

### Responsive Design
- Optimized for all screen sizes
- Touch-friendly buttons
- Swipe gestures supported
- Portrait and landscape modes

### Dark Mode
- Automatically adapts to system theme
- Reduces eye strain at night
- Better battery life on OLED screens

### Offline Capability
- Map tiles cached locally
- Route calculation works offline
- Hazard data syncs when online

---

## 📞 Support

### Need Help?
- Check [Design Document](./GUARDIAN_PATH_DESIGN.md)
- Review [Implementation Tasks](./IMPLEMENTATION_TASKS.md)
- Read [Project Summary](./PROJECT_SUMMARY.md)

### Report Issues
- Note the error message
- Check browser console (F12)
- Verify server logs
- Contact development team

---

## 🌟 Key Features Summary

✅ **Safety-First Routing** - Avoids hazards and prioritizes well-lit areas  
✅ **Turn-by-Turn Navigation** - Clear voice and text instructions  
✅ **Real-Time Updates** - Live hazard data integration  
✅ **Multiple Routes** - Choose between safety and speed  
✅ **Mobile Optimized** - Works perfectly on phones  
✅ **Voice Navigation** - Hands-free operation  
✅ **AI Assistant** - Viosa helps with queries  
✅ **Offline Ready** - Works without internet  

---

## 🎯 Next Steps

1. **Test Navigation**
   - Try different routes
   - Test voice instructions
   - Verify safety scores

2. **Explore Features**
   - Use Viosa chatbot
   - Report issues
   - Check statistics

3. **Provide Feedback**
   - Rate routes
   - Suggest improvements
   - Report bugs

---

## 📱 Add to Home Screen

### iOS (Safari)
1. Tap the Share button
2. Scroll down and tap "Add to Home Screen"
3. Name it "WinGuard"
4. Tap "Add"

### Android (Chrome)
1. Tap the menu (three dots)
2. Tap "Add to Home screen"
3. Name it "WinGuard"
4. Tap "Add"

Now you can launch WinGuard like a native app!

---

## 🔐 Privacy & Security

- ✅ No location tracking without consent
- ✅ Anonymous route calculations
- ✅ No data sold to third parties
- ✅ Secure HTTPS connection (in production)
- ✅ Local data storage only

---

## 🎉 Enjoy Safe Navigation!

WinGuard's Guardian Path Navigator is designed to keep you safe while navigating Bengaluru. Use it whenever you need to find the safest route to your destination.

**Stay Safe. Navigate Smart. Choose WinGuard.** 🛡️
