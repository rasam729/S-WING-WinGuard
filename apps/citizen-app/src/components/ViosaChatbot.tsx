import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'viosa';
  timestamp: Date;
  suggestions?: string[];
}

interface ViosaChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number];
  nearbyReports?: any[];
}

const ViosaChatbot: React.FC<ViosaChatbotProps> = ({ isOpen, onClose, userLocation, nearbyReports }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Viosa, your AI safety assistant for Bengaluru. How can I help you stay safe today?",
      sender: 'viosa',
      timestamp: new Date(),
      suggestions: [
        'Find safe route',
        'Report an issue',
        'Safety tips',
        'Nearby alerts'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Safety tips
    if (lowerMessage.includes('safe') && (lowerMessage.includes('tip') || lowerMessage.includes('advice'))) {
      return `Here are some safety tips for Bengaluru:

🌙 **Night Travel**: Stick to well-lit main roads like MG Road, Brigade Road
🚗 **Transportation**: Use verified cabs (Uber/Ola) with live tracking
👥 **Stay Connected**: Share your location with family/friends
📱 **Emergency**: Keep 100 (Police), 108 (Ambulance) on speed dial
🏃 **Awareness**: Stay alert in crowded areas like KR Market, Majestic

Would you like a safe route to your destination?`;
    }

    // Route finding
    if (lowerMessage.includes('route') || lowerMessage.includes('navigate') || lowerMessage.includes('direction')) {
      const safetyScore = nearbyReports ? Math.max(50, 100 - nearbyReports.length * 5) : 75;
      return `I can help you find the safest route! 🗺️

Current area safety score: ${safetyScore}/100

To get started:
1. Enter your destination in the search bar
2. Toggle "Safe Route" mode
3. I'll calculate the safest path avoiding:
   - Reported potholes
   - Dark areas with broken streetlights
   - High-crime zones

Where would you like to go?`;
    }

    // Report issue
    if (lowerMessage.includes('report') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return `I can help you report a safety issue! 🚨

Common issues in Bengaluru:
• **Potholes**: Especially during monsoon season
• **Broken Streetlights**: Report for faster repairs
• **Dark Alleys**: Help improve lighting
• **Road Damage**: Cracks, debris, etc.

Click the red "Report Issue" button on the map, or tell me what you'd like to report!`;
    }

    // Nearby alerts
    if (lowerMessage.includes('nearby') || lowerMessage.includes('alert') || lowerMessage.includes('around')) {
      const reportCount = nearbyReports?.length || 0;
      if (reportCount === 0) {
        return `Good news! 🎉 There are no active safety issues reported within 5km of your location in Bengaluru. The area appears safe!`;
      }
      return `⚠️ Found ${reportCount} active issue${reportCount > 1 ? 's' : ''} within 5km:

${nearbyReports?.slice(0, 3).map((r: any, i: number) => 
  `${i + 1}. **${r.category}** - ${r.description || 'No description'} (${r.status})`
).join('\n')}

${reportCount > 3 ? `\n...and ${reportCount - 3} more. Check the map for details.` : ''}

Would you like me to suggest a safer route?`;
    }

    // Area information
    if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return `📍 You're in Bengaluru, Karnataka!

Popular safe areas:
• **Koramangala**: Well-lit, good infrastructure
• **Indiranagar**: Active police presence
• **Whitefield**: Tech hub, well-maintained
• **MG Road**: Central, always busy and safe

Areas needing caution:
• Avoid isolated areas after 10 PM
• Be careful in crowded markets
• Stay on main roads when possible

Need specific area information?`;
    }

    // Emergency
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('danger')) {
      return `🚨 **EMERGENCY CONTACTS**

**Police**: 100
**Ambulance**: 108
**Fire**: 101
**Women Helpline**: 1091
**Bengaluru Police Control**: 080-22943225

**Your location**: ${userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Unknown'}

Stay calm and call the appropriate number. I'm here to help!

Are you safe now?`;
    }

    // Weather/time based advice
    const hour = new Date().getHours();
    if (lowerMessage.includes('now') || lowerMessage.includes('current')) {
      if (hour >= 20 || hour < 6) {
        return `🌙 It's nighttime in Bengaluru (${hour}:00).

**Safety recommendations**:
• Use well-lit main roads
• Share your live location
• Prefer verified transportation
• Stay in groups if possible
• Keep emergency contacts ready

Current area status: ${nearbyReports && nearbyReports.length > 0 ? 'Some issues reported' : 'No active issues'}

Need a safe route home?`;
      } else {
        return `☀️ Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}!

Bengaluru is generally safe during daytime. Current conditions:
• Traffic: Moderate to heavy
• Safety: Good visibility
• Infrastructure: ${nearbyReports && nearbyReports.length > 0 ? `${nearbyReports.length} issues reported nearby` : 'All clear'}

How can I assist your journey today?`;
      }
    }

    // Default response with context
    return `I'm here to help with:

🗺️ **Safe Navigation**: Find the safest routes in Bengaluru
🚨 **Report Issues**: Potholes, broken lights, safety concerns
📊 **Area Safety**: Check safety scores for any location
💡 **Safety Tips**: Best practices for Bengaluru
🚑 **Emergency Help**: Quick access to emergency services

What would you like to know?`;
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
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate AI response
    const aiResponse = await generateAIResponse(messageText);
    
    const viosaMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponse,
      sender: 'viosa',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, viosaMessage]);
    setIsTyping(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
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
