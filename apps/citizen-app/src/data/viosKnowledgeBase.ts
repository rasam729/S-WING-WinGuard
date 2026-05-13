/**
 * Viosa AI Assistant - Comprehensive Knowledge Base
 * Contains all information about WinGuard app features and capabilities
 */

export const VIOSA_KNOWLEDGE = {
  // How to submit reports/complaints
  SUBMIT_REPORT: `📝 **How to Submit a Report/Complaint**

**Step-by-Step Guide:**

1. **Navigate to Report Page**
   • Click on "Report Issue" in the navigation menu
   • Or use the floating report button on the map

2. **Upload Photo (Optional but Recommended)**
   • Click the camera icon
   • Take a photo or select from gallery
   • 📍 GPS coordinates will be extracted automatically if available!

3. **Fill Report Details:**
   • **Category**: Select issue type (Pothole, Streetlight, Crime, etc.)
   • **Critical Score**: Rate severity from 1-10
   • **Description**: Describe the issue (keywords like "pothole" auto-detect category!)
   • **Your Experience**: Share what happened (optional)
   • **Location**: Auto-filled from photo GPS or enter manually

4. **Submit**
   • Click "Submit Report"
   • Report goes to Official Dashboard immediately
   • You'll receive updates on fix status

**Pro Tips:**
✅ Take geotagged photos for automatic location
✅ Use keywords like "pothole", "streetlight" for auto-detection
✅ Higher critical scores get priority attention
✅ Track your reports in the Profile section

Your report helps make the city safer! 🛡️`,

  // How to find safe routes
  FIND_SAFE_ROUTE: `🗺️ **How to Find a Safe Route**

**Step 1: Enable Location**
• Click the blue "My Location" button (bottom right)
• Allow location access when prompted
• Your position will appear on the map

**Step 2: Search Destination**
• Use the search bar at the top
• Type location name (e.g., "MG Road", "Koramangala")
• Or enter coordinates: "12.9716, 77.5946"
• Click on search result to highlight location

**Step 3: Calculate Routes**
• Click the compass icon (🧭) in the header
• Or tell me: "Find route to [destination]"
• Enter destination coordinates
• Click "Find Safe Routes"

**Step 4: Choose Your Route**
I'll show you 3 options:
🟢 **Guardian Path** - Safest route (avoids critical hazards)
🟠 **Balanced Route** - Mix of safety and speed
🔵 **Alternative Route** - Fastest route

Each shows:
• ⏱️ Estimated time
• 📍 Distance
• 🛡️ Safety score (0-100)
• ⚠️ Number of hazards

**Step 5: Start Navigation**
• Select your preferred route
• Click "Start Navigation"
• Enable GPS tracking for real-time directions
• Follow turn-by-turn voice guidance

**Real-time Features:**
✅ Live location tracking
✅ Dynamic direction updates
✅ Voice navigation
✅ Hazard avoidance`,

  // How to track hazards
  TRACK_HAZARDS: `⚠️ **How to Track Hazards on Roads**

**Enable Location First:**
• Click the blue "My Location" button
• Allow location access
• Your position will appear on the map

**View Hazards on Map:**
The map shows all hazards with color-coded markers:
• 🔴 **Red** - Critical hazards (severity 8-10)
• 🟠 **Orange** - Moderate hazards (severity 5-7)
• 🟡 **Yellow** - Minor hazards (severity 1-4)
• 🟢 **Green** - Resolved issues
• 🏥 **Pink** - Hospitals (safe havens)
• 👮 **Blue** - Police booths (safe havens)

**Get Hazard Details:**
• Click any marker on the map
• View issue type, description, severity
• See estimated fix date
• Check current status

**Search Radius:**
• 5km circle around your location
• Shows all active hazards
• Real-time updates via WebSocket

**Ask me:**
• "Show nearby hazards" - List hazards near you
• "What's around me?" - Get area safety report
• "Find safe route" - Navigate avoiding hazards`,

  // Emergency help
  EMERGENCY_HELP: `🚨 **EMERGENCY ASSISTANCE**

**Immediate Help:**
📞 Police: **100**
🚑 Ambulance: **108**
🚒 Fire: **101**
👩 Women Helpline: **1091**
🏥 Bengaluru Police: **080-22943225**

**Your Location:**
Share your coordinates with emergency services!

**Nearest Safe Havens:**
🏥 Hospitals - Check pink markers on map
👮 Police Booths - Check blue markers on map

**Stay Calm:**
1. Call the appropriate emergency number
2. Share your location coordinates
3. Stay on the line
4. Follow dispatcher instructions

**Quick Actions:**
• "Find nearest hospital" - Navigate to closest hospital
• "Find police booth" - Navigate to nearest police station
• "Share location" - Copy coordinates to share`,

  // Safety tips
  SAFETY_TIPS_DAY: `🛡️ **Safety Tips for Bengaluru (Day Travel)**

**☀️ Day Safety:**
• Watch for potholes
• Stay alert in heavy traffic areas
• Use designated pedestrian crossings
• Check map before traveling

**📱 Emergency Contacts:**
• Police: 100
• Ambulance: 108
• Women Helpline: 1091
• Fire: 101

**🗺️ Route Planning:**
• Always use "Guardian Path" mode
• Check real-time hazard updates
• Avoid critical hazard zones
• Enable GPS tracking during navigation

**🏥 Safe Havens:**
• Hospitals marked with 🏥 (pink)
• Police booths marked with 👮 (blue)
• Navigate to nearest in emergency`,

  SAFETY_TIPS_NIGHT: `🛡️ **Safety Tips for Bengaluru (Night Travel)**

**🌙 Night Safety:**
• Stick to well-lit main roads (MG Road, Brigade Road, Indiranagar)
• Avoid areas with broken streetlights
• Use verified cabs with live tracking
• Share your location with family/friends
• Stay near police booths (marked 👮 on map)

**📱 Emergency Contacts:**
• Police: 100
• Ambulance: 108
• Women Helpline: 1091
• Fire: 101

**🗺️ Route Planning:**
• Always use "Guardian Path" mode
• Check real-time hazard updates
• Avoid critical hazard zones
• Enable GPS tracking during navigation

**🏥 Safe Havens:**
• Hospitals marked with 🏥 (pink)
• Police booths marked with 👮 (blue)
• Navigate to nearest in emergency`,

  // App features
  APP_FEATURES: `🤖 **Viosa AI Assistant - Complete Guide**

**🗺️ Smart Navigation**
• Calculate 3 route options (Safest/Balanced/Fastest)
• Real-time hazard avoidance
• Turn-by-turn voice directions
• Live GPS tracking
• Dynamic direction updates
• Safety scores for each route

**📝 Report Management**
• Submit complaints with photos
• Auto GPS extraction from images
• Keyword-based category detection
• Track report status
• Receive fix notifications

**📊 Live Data Access**
• Tracked issues across Bengaluru
• Critical hazards to avoid
• Real-time WebSocket updates
• Safety scores by area

**⚠️ Hazard Tracking**
• Potholes
• Broken streetlights
• Police booths
• Hospitals marked on map
• Detailed severity ratings

**🔍 Location Services**
• Search any location in Bengaluru
• Get coordinates instantly
• Highlight locations on map
• Copy coordinates to clipboard

**🚨 Emergency Support**
• Quick access to emergency contacts
• Location sharing
• Navigate to nearest hospital/police
• Safety recommendations

**💬 Ask Me Anything:**
• "How to submit a report?"
• "Find safe route to [destination]"
• "Show nearby hazards"
• "Time to reach [coordinates]"
• "Safety tips"
• "Emergency help"`,

  // Emergency contacts
  EMERGENCY_CONTACTS: {
    police: '100',
    ambulance: '108',
    fire: '101',
    womenHelpline: '1091',
    bengaluruPolice: '080-22943225',
  },

  // Keywords for auto-detection
  KEYWORDS: {
    report: ['report', 'complaint', 'submit', 'issue'],
    route: ['route', 'navigate', 'direction', 'path', 'way'],
    hazard: ['hazard', 'nearby', 'around', 'danger', 'risk'],
    emergency: ['emergency', 'help', 'danger', 'sos', 'urgent'],
    safety: ['safe', 'tip', 'advice', 'recommendation'],
    stats: ['stat', 'data', 'dashboard', 'number', 'count'],
    time: ['time', 'reach', 'take', 'eta', 'duration'],
    track: ['track', 'follow', 'monitor', 'watch'],
  },
};

export default VIOSA_KNOWLEDGE;
