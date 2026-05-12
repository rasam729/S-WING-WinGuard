import React, { useState, useEffect, useRef } from 'react';
import { mockIssues, getIssuesNearLocation, getIssueStats, calculateSafetyScore } from '../store/issuesStore';
import { generateRouteOptions, getRouteSummary, RouteOption } from '../utils/enhancedSafeRouteCalculator';

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

    // Route finding with destination
    if (awaitingDestination || lowerMessage.includes('route') || lowerMessage.includes('navigate') || lowerMessage.includes('direction')) {
      if (!userLocation) {
        return {
          text: `I need your current location to calculate routes. Please enable location services and click the "My Location" button on the map first! 📍`
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

Click on any route below to view it on the map! The routes avoid ${stats.critical} critical hazards including potholes and broken streetlights.`,
          routes
        };
      }

      setAwaitingDestination(true);
      return {
        text: `Great! I can calculate the safest route for you. 🗺️

Please provide your destination in one of these formats:
• Coordinates: "12.9716, 77.5946"
• Or click on the map to set destination
• Or describe the location: "MG Road", "Koramangala"

Current location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}
Area safety score: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100`
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
    if (lowerMessage.includes('nearby') || lowerMessage.includes('alert') || lowerMessage.includes('around') || lowerMessage.includes('hazard')) {
      if (!userLocation) {
        return {
          text: `Please enable location services to see nearby hazards! 📍`
        };
      }

      const nearbyIssues = getIssuesNearLocation({ lat: userLocation[0], lng: userLocation[1] }, 2);
      const activeIssues = nearbyIssues.filter(i => i.status !== 'resolved');
      const criticalIssues = activeIssues.filter(i => i.status === 'critical');
      
      if (activeIssues.length === 0) {
        return {
          text: `🎉 **Great news!** No active hazards within 2km of your location!

Your area safety score: ${Math.round(calculateSafetyScore({ lat: userLocation[0], lng: userLocation[1] }, 1))}/100

The roads are clear and safe for travel. Have a safe journey! 🚗`
        };
      }

      return {
        text: `⚠️ **Hazards Near You** (within 2km)

**Summary:**
• Total: ${activeIssues.length} active issues
• Critical: ${criticalIssues.length} 🔴
• In Progress: ${activeIssues.filter(i => i.status === 'in_progress').length} 🔵

**Details:**
${activeIssues.slice(0, 5).map((issue, idx) => {
  const dist = Math.round(calculateDistance({ lat: userLocation[0], lng: userLocation[1] }, { lat: issue.latitude, lng: issue.longitude }) * 1000);
  const statusEmoji = issue.status === 'critical' ? '🔴' : '🔵';
  return `${idx + 1}. ${statusEmoji} **${issue.type.replace('_', ' ').toUpperCase()}** (${dist}m away)
   ${issue.description}
   Severity: ${issue.severity}/10`;
}).join('\n\n')}

${activeIssues.length > 5 ? `\n...and ${activeIssues.length - 5} more issues.` : ''}

💡 **Recommendation:** Use "Safe Route" mode when navigating to avoid these hazards!

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
    <div className="fixed inset-0 z-[1100] flex items-end justify-end p-6 pointer-events-none">
      <div className="w-full max-w-md h-[600px] bg-surface rounded-3xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Viosa</h2>
                <p className="text-sm opacity-90">AI Safety Assistant</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-low">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-surface shadow-md text-on-surface'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-on-surface-variant'}`}>
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
              <div className="bg-surface shadow-md rounded-2xl p-4">
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
        <div className="p-4 bg-surface border-t border-outline-variant/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Viosa anything..."
              className="flex-1 px-4 py-3 rounded-full border border-outline-variant bg-surface-container focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
