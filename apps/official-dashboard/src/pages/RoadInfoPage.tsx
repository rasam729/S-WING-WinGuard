import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_ISSUES, AUTHORITIES, getAuthoritiesForIssue, CURRENCIES, convertCurrency, formatCurrency, type GlobalIssue } from '../data/globalData';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  critical:    'bg-red-900/40 text-red-400 border-red-700',
  in_progress: 'bg-blue-900/40 text-blue-400 border-blue-700',
  resolved:    'bg-green-900/40 text-green-400 border-green-700'
};
const TYPE_ICON: Record<string, string> = {
  pothole: '🕳️', streetlight: '💡', police_booth: '🚔', camera: '📷', road_crack: '⚡', drainage: '🌊'
};
const ROAD_TYPE_STYLE: Record<string, string> = {
  NH: 'bg-amber-900/40 text-amber-400 border-amber-700',
  SH: 'bg-blue-900/40 text-blue-400 border-blue-700',
  MDR: 'bg-purple-900/40 text-purple-400 border-purple-700',
  Highway: 'bg-orange-900/40 text-orange-400 border-orange-700',
  Motorway: 'bg-red-900/40 text-red-400 border-red-700',
  Arterial: 'bg-teal-900/40 text-teal-400 border-teal-700',
  Local: 'bg-gray-800 text-gray-400 border-gray-600'
};

const CONTINENTS = ['All', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Africa'];

interface ContactLog {
  issueId: string;
  authorityId: string;
  authorityName: string;
  contactedAt: string;
  method: string;
  status: 'pending' | 'responded' | 'resolved';
}

export default function RoadInfoPanel() {
  const navigate = useNavigate();
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [selectedCountry, setSelectedCountry]     = useState('All');
  const [selectedType, setSelectedType]           = useState('All');
  const [selectedIssue, setSelectedIssue]         = useState<GlobalIssue | null>(null);
  const [contactLogs, setContactLogs]             = useState<ContactLog[]>([]);
  const [displayCurrency, setDisplayCurrency]     = useState('USD');
  const [activeTab, setActiveTab]                 = useState<'issues' | 'contacts'>('issues');

  const countries = ['All', ...Array.from(new Set(GLOBAL_ISSUES.map(i => i.country))).sort()];
  const types     = ['All', ...Array.from(new Set(GLOBAL_ISSUES.map(i => i.type)))];

  const filtered = GLOBAL_ISSUES.filter(i =>
    (selectedContinent === 'All' || i.continent === selectedContinent) &&
    (selectedCountry   === 'All' || i.country   === selectedCountry) &&
    (selectedType      === 'All' || i.type       === selectedType)
  );

  void CURRENCIES.find(c => c.code === displayCurrency); // cur reserved for future display

  const formatCost = (issue: GlobalIssue) => {
    const converted = convertCurrency(issue.estimatedCost, issue.currency, displayCurrency);
    return formatCurrency(converted, displayCurrency);
  };

  const contactAuthority = (issue: GlobalIssue, authority: typeof AUTHORITIES[0], method: string) => {
    const log: ContactLog = {
      issueId: issue.id, authorityId: authority.id, authorityName: authority.name,
      contactedAt: new Date().toISOString(), method, status: 'pending'
    };
    setContactLogs(prev => [log, ...prev]);
    if (method === 'phone') window.open(`tel:${authority.phone}`);
    if (method === 'email') window.open(`mailto:${authority.email}?subject=Issue ${issue.id}: ${issue.title}&body=Location: ${issue.location}, ${issue.city}, ${issue.country}%0ARoad Type: ${issue.roadType}%0AContractor: ${issue.contractorName}%0ALast Relay: ${issue.lastRelayDate}`);
    if (method === 'whatsapp' && authority.whatsapp) window.open(`https://wa.me/${authority.whatsapp.replace(/\D/g,'')}?text=Reporting Issue ${issue.id}: ${issue.title} at ${issue.location}`);
  };

  const updateContactStatus = (idx: number, status: ContactLog['status']) => {
    setContactLogs(prev => prev.map((l, i) => i === idx ? { ...l, status } : l));
  };

  const daysSinceRelay = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days > 730) return { label: `${Math.floor(days/365)}y ago`, color: 'text-red-400' };
    if (days > 365) return { label: `${Math.floor(days/30)}mo ago`, color: 'text-orange-400' };
    return { label: `${days}d ago`, color: 'text-green-400' };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              🛣️ Global Road Info & Engineer Contacts
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency switcher */}
            <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg border border-gray-700 text-sm focus:outline-none">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {[{ id: 'issues', label: '🛣️ Road Issues & Info' }, { id: 'contacts', label: `📞 Contact Log (${contactLogs.length})` }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 py-6">

        {activeTab === 'issues' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select value={selectedContinent} onChange={e => { setSelectedContinent(e.target.value); setSelectedCountry('All'); }}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 text-sm">
                {CONTINENTS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 text-sm">
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 text-sm">
                {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.replace('_', ' ')}</option>)}
              </select>
              <span className="text-gray-400 text-sm self-center">{filtered.length} issues</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(issue => {
                const relay = daysSinceRelay(issue.lastRelayDate);
                const authorities = getAuthoritiesForIssue(issue.type, issue.city, issue.country);
                return (
                  <div key={issue.id}
                    className={`bg-gray-900 rounded-2xl border p-5 cursor-pointer hover:shadow-lg transition-all ${selectedIssue?.id === issue.id ? 'border-teal-500' : 'border-gray-800 hover:border-gray-600'}`}
                    onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}>
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{TYPE_ICON[issue.type]}</span>
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{issue.title}</p>
                          <p className="text-gray-400 text-xs">{issue.location}, {issue.city}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${STATUS_BADGE[issue.status]}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Road & relay info */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${ROAD_TYPE_STYLE[issue.roadType] || 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                          {issue.roadType}
                        </span>
                        <p className="text-gray-500 mt-1">Road Type</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                        <p className={`font-bold ${relay.color}`}>{relay.label}</p>
                        <p className="text-gray-500">Last Relaid</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                        <p className="text-yellow-400 font-bold">{formatCost(issue)}</p>
                        <p className="text-gray-500">Est. Cost</p>
                      </div>
                    </div>

                    {/* Contractor */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>🏗️</span>
                      <span className="text-gray-300 font-medium">{issue.contractorName}</span>
                      <span className="ml-auto">
                        🌍 {issue.country} · Sev: <span className={`font-bold ${issue.severity >= 8 ? 'text-red-400' : issue.severity >= 6 ? 'text-orange-400' : 'text-yellow-400'}`}>{issue.severity}/10</span>
                      </span>
                    </div>

                    {/* Expanded: Authority contacts */}
                    {selectedIssue?.id === issue.id && (
                      <div className="mt-3 border-t border-gray-700 pt-3">
                        <p className="text-xs font-bold text-gray-300 mb-2">📞 Relevant Authorities</p>
                        {authorities.length === 0 && (
                          <p className="text-xs text-gray-500">No specific authority found. Contact local municipality.</p>
                        )}
                        {authorities.map(auth => (
                          <div key={auth.id} className="bg-gray-800/60 rounded-lg p-3 mb-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-white font-semibold text-xs">{auth.name}</p>
                                <p className="text-gray-400 text-xs">{auth.designation} · {auth.department}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-yellow-400 text-xs">⭐{auth.rating}</span>
                                  <span className="text-gray-500 text-xs">· ~{auth.avgResponseHours}h response</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={e => { e.stopPropagation(); contactAuthority(issue, auth, 'phone'); }}
                                className="flex-1 py-1.5 bg-green-700 text-white rounded text-xs font-bold hover:bg-green-600 transition">📞 Call</button>
                              <button onClick={e => { e.stopPropagation(); contactAuthority(issue, auth, 'email'); }}
                                className="flex-1 py-1.5 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-600 transition">✉️ Email</button>
                              {auth.whatsapp && (
                                <button onClick={e => { e.stopPropagation(); contactAuthority(issue, auth, 'whatsapp'); }}
                                  className="flex-1 py-1.5 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-600 transition">💬 WA</button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <button onClick={e => { e.stopPropagation(); navigate('/simulations'); }}
                            className="flex-1 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-600 transition">🗺️ Simulate</button>
                          <button onClick={e => { e.stopPropagation(); navigate('/budget'); }}
                            className="flex-1 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition">💰 Budget</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            {contactLogs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📞</div>
                <p className="text-gray-400">No contacts made yet.</p>
                <p className="text-gray-500 text-sm mt-1">Go to Road Issues and click an authority to contact them.</p>
              </div>
            ) : contactLogs.map((log, i) => {
              const issue = GLOBAL_ISSUES.find(x => x.id === log.issueId);
              return (
                <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">{log.authorityName}</p>
                      <p className="text-gray-400 text-sm">{issue?.title} · {issue?.location}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        via {log.method.toUpperCase()} · {new Date(log.contactedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      log.status === 'resolved'   ? 'bg-green-900/40 text-green-400 border-green-700' :
                      log.status === 'responded'  ? 'bg-blue-900/40 text-blue-400 border-blue-700' :
                      'bg-yellow-900/40 text-yellow-400 border-yellow-700'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {(['pending','responded','resolved'] as const).map(s => (
                      <button key={s} onClick={() => updateContactStatus(i, s)}
                        disabled={log.status === s}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize ${log.status === s ? 'opacity-40 cursor-not-allowed bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
