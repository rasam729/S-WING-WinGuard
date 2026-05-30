import { useState, useRef, useEffect } from 'react';

// ── Offline-capable knowledge base ───────────────────────────────────────────
const KB: { patterns: RegExp[]; answer: string }[] = [
  { patterns: [/pothole|road damage|road repair/i], answer: '🚧 **Pothole Reports**: Go to Issues → select "Pothole". Our AI estimates repair cost at ₹48K–₹85K per cluster. Assign to nearest engineer via the Assignments tab. Average resolution time is 72 hours.' },
  { patterns: [/streetlight|light out|dark road/i], answer: '💡 **Streetlight Issues**: Navigate to Issues → Streetlight. Each installation reduces nearby crime by ~15%. AI cost estimate: ₹85K per unit. Contact BESCOM (India) or your local utility authority.' },
  { patterns: [/police booth|crime|security/i], answer: '🚔 **Police Booth**: Found under Issues → Police Booth. Each booth reduces crime by ~25% within 500m. Estimated setup cost: ₹3.2L. Route to DCP Traffic or local law enforcement authority.' },
  { patterns: [/budget|cost|fund|money|allocat/i], answer: '💰 **Budget**: The Budget page shows AI cost estimates vs sanctioned vs actual spend. Currency can be switched between USD, INR, EUR, GBP, JPY and 8 others. Click "AI Feasibility" tab to see ROI and profit/loss analysis.' },
  { patterns: [/currency|convert|exchange/i], answer: '💱 **Currency Conversion**: In the Budget page, use the currency switcher (top right). We support 12 currencies: USD, INR, GBP, EUR, JPY, AUD, BRL, AED, ZAR, CAD, SGD, CNY with live-like conversion rates.' },
  { patterns: [/simulat|digital twin|place|infrastructure/i], answer: '🗺️ **Simulations**: Click "▶ Start Simulation" to enter planning mode. Click any tool (Police Booth, Streetlight, etc.) then click on the map to place it. The AI calculates location-adjusted cost instantly. Run "AI Impact Analysis" to see crime reduction, safety score, and ROI.' },
  { patterns: [/safe route|routing|directions|navigate/i], answer: '🛡️ **Safe Route (Citizen App)**: In the citizen app, go to "Safe Route". Enter origin and destination. The app uses live hazard data from the dashboard to avoid high-severity issue zones and ranks routes by safety score (0–100).' },
  { patterns: [/analytics|graph|chart|trend/i], answer: '📊 **Analytics**: The Analytics page has 5 tabs — Overview, Issues, Crime Rate, Budget, Safety Score. All charts use real data from reports and issues. Switch the time range (3/6/12/24 months) in the top bar.' },
  { patterns: [/report|complaint|submit/i], answer: '📋 **Reports**: Citizens submit reports via the citizen app. On the dashboard, go to Reports → filter by Pending / In Progress / Resolved. Click "Simulate Fix" to model the repair cost or "💰 Budget" to link it to finance.' },
  { patterns: [/engineer|authority|contact|assign/i], answer: '👷 **Engineers**: Go to the Engineers page to see all available authorities with workload, rating, and jurisdiction. Issues are auto-routed based on category and location. Click an engineer card to see their active assignments.' },
  { patterns: [/road type|NH|SH|MDR|highway|motorway/i], answer: '🛣️ **Road Types**: India uses NH (National Highway), SH (State Highway), MDR (Major District Road). Other countries: UK uses Motorway/A-Road, USA uses Interstate/US Highway, Germany uses Autobahn. Road type affects repair cost and authority jurisdiction.' },
  { patterns: [/contractor|relay|resurface|last pav/i], answer: '🏗️ **Contractor & Relay Info**: Each issue card shows the contractor name and last relay date. This helps determine warranty periods and responsibility. Filter issues by road type in the dashboard.' },
  { patterns: [/crime rate|crime trend|safety score/i], answer: '🔒 **Crime Rate & Safety Score**: The Analytics → Crime Rate tab shows before/after projections for planned infrastructure. Each streetlight: -15% crime, each police booth: -25% crime. Safety Score is calculated per ward (0–100).' },
  { patterns: [/offline|no network|low signal|cache/i], answer: '📶 **Offline Mode**: WinGuard works offline for viewing cached issues, reports, and analytics. Data syncs automatically when connection is restored. The chatbot also works offline using its built-in knowledge base.' },
  { patterns: [/global|worldwide|international|country/i], answer: '🌍 **Global Coverage**: WinGuard monitors issues in 12+ countries across 6 continents — India, USA, UK, Germany, Japan, Australia, Brazil, UAE, South Africa, Canada, Singapore. Switch countries on the map using the filter dropdown.' },
  { patterns: [/hello|hi|hey|help|start/i], answer: '👋 Hi! I\'m **Viosa**, WinGuard\'s AI assistant. I can help with:\n• 📋 Issues & Reports\n• 💰 Budget & Currency\n• 🗺️ Simulations & Digital Twin\n• 🛡️ Safe Route Planning\n• 📊 Analytics & Charts\n• 👷 Engineer Routing\n• 🌍 Global Infrastructure\n\nWhat would you like to know?' },
  { patterns: [/thank|thanks|great|awesome/i], answer: '😊 You\'re welcome! Let me know if you have any more questions about road safety or infrastructure.' },
];

function getOfflineAnswer(question: string): string {
  for (const entry of KB) {
    if (entry.patterns.some(p => p.test(question))) return entry.answer;
  }
  return '🤔 I don\'t have a specific answer for that right now (possibly offline). Try asking about: budget, reports, simulations, safe routes, engineers, crime rates, or road types. Data will sync when connectivity is restored.';
}

interface Message { role: 'user' | 'assistant'; text: string; time: string; offline?: boolean }

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/•/g, '•')
    .replace(/\n/g, '<br/>');
}

export default function ViosaChatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '👋 Hi! I\'m **Viosa**, your WinGuard AI assistant. Ask me anything about road safety, budgets, simulations, or reports!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: q, time: now }]);
    setInput('');
    setLoading(true);

    // Always try offline KB first for speed; fall back to API if online
    const offlineAns = getOfflineAnswer(q);

    if (!isOnline) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: offlineAns, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), offline: true }]);
        setLoading(false);
      }, 400);
      return;
    }

    // Online: try Gemini-style API or fallback to KB
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, context: 'WinGuard urban road safety dashboard. Features: global issues map, budget with 12 currencies, digital twin simulations, analytics, safe route planning, engineer routing, crime rate tracking.' }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply || offlineAns, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Graceful degradation to offline KB
      setMessages(prev => [...prev, { role: 'assistant', text: offlineAns, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), offline: true }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = ['💰 Budget overview', '🗺️ How to simulate?', '🛡️ Safe route help', '🌍 Global issues', '📊 Crime rate trends'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        title="Viosa AI Assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
        {!isOnline && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-xs">!</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[360px] max-h-[580px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Viosa AI Assistant</p>
              <p className="text-teal-100 text-xs">WinGuard Intelligence Layer</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-orange-300'}`}/>
              <span className="text-teal-100 text-xs">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {!isOnline && (
            <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 flex items-center gap-2">
              <span className="text-orange-500 text-sm">📶</span>
              <p className="text-orange-700 text-xs font-medium">Offline mode — using built-in knowledge base</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: '340px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  <p
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
                  />
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {msg.offline && <span className="text-xs opacity-60">📶 offline</span>}
                    <span className={`text-xs ${msg.role === 'user' ? 'text-teal-200' : 'text-gray-400'}`}>{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => { setInput(p.replace(/^[^\s]+ /, '')); }}
                className="flex-shrink-0 px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-100 transition whitespace-nowrap border border-teal-200"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask Viosa anything…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition disabled:opacity-40 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
