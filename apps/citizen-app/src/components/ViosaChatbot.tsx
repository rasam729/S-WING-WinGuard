import React, { useState, useEffect, useRef } from 'react';
import { mockIssues, getIssuesNearLocation, getIssueStats, calculateSafetyScore } from '../store/issuesStore';
import { generateRouteOptions, getRouteSummary, RouteOption } from '../utils/enhancedSafeRouteCalculator';
import { VIOSA_KNOWLEDGE } from '../data/viosKnowledgeBase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'viosa';
  timestamp: Date;
  suggestions?: string[];
  routes?: RouteOption[];
}

interface ViosaChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number];
  nearbyReports?: any[];
  onRouteSelect?: (route: RouteOption) => void;
}

const ViosaChatbot: React.FC<ViosaChatbotProps> = ({ isOpen, onClose, userLocation, nearbyReports, onRouteSelect }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Viosa, your AI safety assistant for Bengaluru. I have access to real-time data on road hazards, safety statistics, and can help you find the safest routes. How can I help you today?",
      sender: 'viosa',
      timestamp: new Date(),
      suggestions: [
        'Find safe route',
        'Show nearby hazards',
        'Safety statistics',
        'Emergency help'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [awaitingDestination, setAwaitingDestination] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<{ text: string; routes?: RouteOption[] }> => {
    const lowerMessage = userMessage.toLowerCase();
    const stats = getIssueStats();

    // How to submit report/complaint
    if ((lowerMessage.includes('how') || lowerMessage.includes('submit')) && (lowerMessage.includes('report') || lowerMessage.includes('complaint') || lowerMessage.includes('issue'))) {
      return {
        text: VIOSA_KNOWLEDGE.SUBMIT_REPORT + `\n\nCurrent active issues in Bengaluru: ${stats.total}\nYour report helps make the city safer! 🛡️`
      };
    }

    // Time to reach location
    if (lowerMessage.includes('time') && (lowerMessage.includes('reach') || lowerMessage.includes('take') || lowerMessage.includes('eta'))) {
      const coordMatch = userMessage.match(/(\d+\.\d+)[,\s]+(\d+\.\d+)/);
      if (coordMatch && userLocation) {
        const destLat = parseFloat(coordMatch[1]);
        const destLng = parseFloat(coordMatch[2]);
        
        const routes = generateRouteOptions(
          { lat: userLocation[0], lng: userLocation[1] },
          { lat: destLat, lng: destLng }
        );

        const guardianRoute = routes.find(r => r.name === 'Guardian Path');
        const fastestRoute = routes.reduce((prev, curr) => 
          curr.estimatedTime < prev.estimatedTime ? curr : prev
        );

        return {
          text: `⏱️ **Estimated Time to Reach (${destLat.toFixed(4)}, ${destLng.toFixed(4)})**

**From Your Location:**
📍 ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}

**Route Options:**

🟢 **Guardian Path (Safest)**
• Time: **${guardianRoute?.estimatedTime} minutes**
• Distance: ${guardianRoute?.distance} km
• Safety Score: ${guardianRoute?.safetyScore}/100
• Avoids ${guardianRoute?.hazards.totalIssues} hazards

🔵 **Fastest Route**
• Time: **${fastestRoute.estimatedTime} minutes**
• Distance: ${fastestRoute.distance} km
• Safety Score: ${fastestRoute.safetyScore}/100
• ${fastestRoute.hazards.totalIssues} hazards on route

**Time Difference:** ${Math.abs((guardianRoute?.estimatedTime || 0) - fastestRoute.estimatedTime)} minutes

**Factors Affecting Time:**
• Traffic conditions (not included)
• Road quality
• Number of turns
• Hazard avoidance

**Want to navigate?**
Say "start navigation" or click on a route below to begin!`,
          routes
        };
      }

      return {
        text: `⏱️ **Calculate Travel Time**

To estimate time to reach a location, I need:

1. **Your current location** (✅ ${userLocation ? 'Enabled' : '❌ Not enabled'})
2. **Destination coordinates**

**Provide destination:**
• Type coordinates: "12.9716, 77.5946"
• Or say: "Time to reach MG Road"
• Or use search bar to find location

**I'll calculate:**
• 🟢 Safest route time
• 🔵 Fastest route time
• 📍 Distance for each route
• 🛡️ Safety scores
• ⚠️ Hazards to avoid

${!userLocation ? '\n📍 **Enable location first** by clicking the blue "My Location" button!' : '\nType destination coordinates now!'}`
      };
    }

    // Route finding with destination
    if (awaitingDestination || lowerMessage.includes('route') || lowerMessage.includes('navigate') || lowerMessage.includes('direction')) {
      if (!userLocation) {
        return {
          text: VIOSA_KNOWLEDGE.FIND_SAFE_ROUTE.replace('Enable your location first, then I can help you navigate!', 'I need your current location to calculate routes. Please enable location services and click the "My Location" button on the map first! 📍')
        };
      }

      // Check if message contains coordinates or location
      const coordMatch = userMessage.match(/(\d+\.\d+)[,\s]+(\d+\.\d+)/);
      if (coordMatch) {
        const destLat = parseFloat(coordMatch[1]);
        const destLng = parseFloat(coordMatch[2]);
        
        const routes = generateRouteOptions(
          { lat: userLocation[0], lng: userLocation[1] },
          { lat: destLat, lng: destLng }
        );

        return {
          text: `Perfect! I've calculated 3 route options for you from your current location to (${destLat.toFixed(4)}, ${destLng.toFixed(4)}):

${routes.map((route, idx) => `**${idx + 1}. ${route.name}** ${route.color === '#10b981' ? '🟢' : route.color === '#f59e0b' ? '🟠' : '🔵'}
${getRouteSummary(route)}
`).join('\n')}

Click on any route below to view it on the map! The routes avoid ${stats.critical} critical hazards including potholes and broken streetlights.

**To start navigation:**
1. Click on your preferred route
2. Route will appear on map
3. Click "Start Navigation" for turn-by-turn directions
4. Enable GPS tracking (green button) for real-time updates`,
          routes
        };
      }

      setAwaitingDestination(true);
      return {
        text: `Great! I can calculate the safest route for you. 🗺️

**Your Current Location:**
📍 ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}
Area safety score: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100

**Provide Destination:**
• **Coordinates**: "12.9716, 77.5946"
• **Search**: Use the search bar to find a location
• **Map Click**: Enable coordinate picker and click destination

**What I'll Calculate:**
🟢 Guardian Path - Safest (avoids ${stats.critical} hazards)
🟠 Balanced Route - Safety + Speed
🔵 Alternative - Fastest

Each route includes:
• Estimated time and distance
• Safety score
• Turn-by-turn directions
• Real-time tracking support

Type your destination or coordinates now!`
      };
    }

    // Statistics and dashboard data
    if (lowerMessage.includes('stat') || lowerMessage.includes('data') || lowerMessage.includes('dashboard') || lowerMessage.includes('report')) {
      const nearbyIssues = userLocation ? getIssuesNearLocation({ lat: userLocation[0], lng: userLocation[1] }, 5) : [];
      const activeNearby = nearbyIssues.filter(i => i.status !== 'resolved');
      
      return {
        text: `📊 **Bengaluru Safety Dashboard**

**City-wide Statistics:**
• Total Issues: ${stats.total}
• Critical: ${stats.critical} 🔴
• In Progress: ${stats.inProgress} 🔵
• Resolved: ${stats.resolved} 🟢

**Issue Breakdown:**
• Potholes: ${stats.potholes}
• Broken Streetlights: ${stats.streetlights}
• Police Booths: ${stats.policeBooths}

${userLocation ? `**Your Area (5km radius):**
• Total Issues: ${nearbyIssues.length}
• Active Issues: ${activeNearby.length}
• Safety Score: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100

${activeNearby.length > 0 ? `⚠️ Top concerns near you:
${activeNearby.slice(0, 3).map((issue, idx) => `${idx + 1}. ${issue.type.replace('_', ' ')} - ${issue.description}`).join('\n')}` : '✅ No active issues in your immediate area!'}` : ''}

Would you like me to find a safe route avoiding these hazards?`
      };
    }

    // Nearby hazards
    if (lowerMessage.includes('nearby') || lowerMessage.includes('alert') || lowerMessage.includes('around') || lowerMessage.includes('hazard') || lowerMessage.includes('track')) {
      if (!userLocation) {
        return {
          text: VIOSA_KNOWLEDGE.TRACK_HAZARDS + `\n\n**Current City-wide Stats:**
• Total Issues: ${stats.total}
• Critical: ${stats.critical} 🔴
• Potholes: ${stats.potholes}
• Broken Streetlights: ${stats.streetlights}
• Police Booths: ${stats.policeBooths}

Enable location to see hazards in your area! 📍`
        };
      }

      const nearbyIssues = getIssuesNearLocation({ lat: userLocation[0], lng: userLocation[1] }, 2);
      const activeIssues = nearbyIssues.filter(i => i.status !== 'resolved');
      const criticalIssues = activeIssues.filter(i => i.status === 'critical');
      
      if (activeIssues.length === 0) {
        return {
          text: `🎉 **Great news!** No active hazards within 2km of your location!

**Your Area Status:**
📍 Location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}
🛡️ Safety Score: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100
✅ Status: Safe for travel

**How to Stay Updated:**
• Hazards are tracked in real-time
• Map updates automatically via WebSocket
• Check before each journey
• Enable GPS tracking during navigation

**City-wide Overview:**
• Total Active Issues: ${stats.total - stats.resolved}
• Critical Hazards: ${stats.critical}
• In Progress Fixes: ${stats.inProgress}

The roads are clear and safe for travel. Have a safe journey! 🚗

**Want to:**
• Find a safe route? Say "navigate to [destination]"
• Check another area? Use the search bar
• Report a new issue? Click "Report Issue"`
        };
      }

      return {
        text: `⚠️ **Hazards Near You** (within 2km)

**Summary:**
📍 Your Location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}
🛡️ Area Safety: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100
• Total: ${activeIssues.length} active issues
• Critical: ${criticalIssues.length} 🔴
• In Progress: ${activeIssues.filter(i => i.status === 'in_progress').length} 🔵

**Detailed Hazards:**
${activeIssues.slice(0, 5).map((issue, idx) => {
  const dist = Math.round(calculateDistance({ lat: userLocation[0], lng: userLocation[1] }, { lat: issue.latitude, lng: issue.longitude }) * 1000);
  const statusEmoji = issue.status === 'critical' ? '🔴' : '🔵';
  return `${idx + 1}. ${statusEmoji} **${issue.type.replace('_', ' ').toUpperCase()}** (${dist}m away)
   📝 ${issue.description}
   ⚠️ Severity: ${issue.severity}/10
   📍 ${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`;
}).join('\n\n')}

${activeIssues.length > 5 ? `\n...and ${activeIssues.length - 5} more issues.` : ''}

**💡 Recommendations:**
✅ Use "Guardian Path" mode when navigating
✅ Avoid areas with critical hazards (🔴)
✅ Check map before traveling
✅ Enable real-time tracking during navigation

**Actions:**
• "Find safe route to [destination]" - Navigate avoiding these hazards
• "Show on map" - View hazards visually
• "Report new issue" - Submit a complaint

Would you like me to calculate a safe route for you?`
      };
    }

    // Safety tips
    if (lowerMessage.includes('safe') && (lowerMessage.includes('tip') || lowerMessage.includes('advice'))) {
      const hour = new Date().getHours();
      const isNight = hour >= 20 || hour < 6;
      
      return {
        text: `🛡️ **Safety Tips for Bengaluru** ${isNight ? '(Night Travel)' : ''}

${isNight ? `**🌙 Night Safety:**
• Stick to well-lit main roads (MG Road, Brigade Road, Indiranagar)
• Avoid areas with broken streetlights (${stats.streetlights} reported)
• Use verified cabs with live tracking
• Share your location with family/friends` : `**☀️ Day Safety:**
• Watch for potholes (${stats.potholes} active)
• Stay alert in heavy traffic areas
• Use designated pedestrian crossings`}

**📱 Emergency Contacts:**
• Police: 100
• Ambulance: 108
• Women Helpline: 1091

**🗺️ Route Planning:**
• Always use "Safe Route" mode
• Check real-time hazard updates
• Avoid ${stats.critical} critical hazard zones

Current area safety: ${userLocation ? `${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100` : 'Enable location to check'}

Need a safe route to your destination?`
      };
    }

    // Emergency
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('danger') || lowerMessage.includes('sos')) {
      return {
        text: `🚨 **EMERGENCY ASSISTANCE**

**Immediate Help:**
📞 Police: **100**
🚑 Ambulance: **108**
🚒 Fire: **101**
👩 Women Helpline: **1091**
🏥 Bengaluru Police: **080-22943225**

${userLocation ? `**Your Location:**
📍 ${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}
Share this with emergency services!` : '📍 Enable location to share with emergency services'}

**Stay Calm:**
1. Call the appropriate emergency number
2. Share your location
3. Stay on the line
4. Follow dispatcher instructions

Are you safe now? Do you need me to guide you to the nearest police station or hospital?`
      };
    }

    // Default intelligent response
    const safetyScore = userLocation ? Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1)) : null;
    
    return {
      text: `I'm here to help with comprehensive safety information! 🛡️

**What I can do:**

🗺️ **Smart Navigation**
• Calculate 3 route options (Safest/Balanced/Fastest)
• Real-time hazard avoidance
• Safety scores for each route

📊 **Live Data Access**
• ${stats.total} tracked issues across Bengaluru
• ${stats.critical} critical hazards to avoid
• Real-time status updates

⚠️ **Hazard Information**
• ${stats.potholes} potholes
• ${stats.streetlights} broken streetlights
• Detailed severity ratings

🚨 **Emergency Support**
• Quick access to emergency contacts
• Location sharing
• Safety recommendations

${safetyScore !== null ? `\n📍 **Your Current Area:**
Safety Score: ${safetyScore}/100 ${safetyScore >= 80 ? '✅ Safe' : safetyScore >= 60 ? '⚠️ Moderate' : '🔴 Caution'}` : ''}

What would you like to know?`
    };
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate AI response
    const response = await generateAIResponse(messageText);
    
    const viosaMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      sender: 'viosa',
      timestamp: new Date(),
      routes: response.routes,
    };
    
    setMessages(prev => [...prev, viosaMessage]);
    setIsTyping(false);
    setAwaitingDestination(false);
  };

  const handleRouteClick = (route: RouteOption) => {
    if (onRouteSelect) {
      onRouteSelect(route);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Perfect! I've loaded the **${route.name}** on your map. You can see the route highlighted in ${route.color === '#10b981' ? 'green 🟢' : route.color === '#f59e0b' ? 'orange 🟠' : 'blue 🔵'}. Follow the route to avoid ${route.hazards.totalIssues} hazards. Safe travels! 🚗`,
        sender: 'viosa',
        timestamp: new Date(),
      }]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Helper function to calculate distance
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371;
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-end p-4 md:p-6 pointer-events-none">
      <div className="w-full max-w-md h-[85vh] md:h-[600px] bg-white rounded-3xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-gray-200">
        {/* Header with WinGuard branding */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Viosa
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI</span>
                </h2>
                <p className="text-xs opacity-90">
                  <span className="text-cyan-200">Win</span>
                  <span className="text-orange-200">Guard</span> Safety Assistant
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white shadow-md text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                
                {/* Route Options */}
                {message.routes && message.routes.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {message.routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => handleRouteClick(route)}
                        className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:border-white/40"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{route.name}</span>
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: route.color }}
                          ></span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>📍 {route.distance} km</div>
                          <div>⏱️ {route.estimatedTime} min</div>
                          <div>🛡️ {route.safetyScore}/100</div>
                          <div>⚠️ {route.hazards.totalIssues} hazards</div>
                        </div>
                        <div className="mt-2 text-xs opacity-80">{route.recommendation}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Viosa anything..."
              className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViosaChatbot;
