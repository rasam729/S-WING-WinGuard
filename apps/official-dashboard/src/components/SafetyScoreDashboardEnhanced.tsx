/**
 * Enhanced Safety Score Dashboard
 * Modern UI/UX with animations, charts, and interactive elements
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SafetyScore {
  crimeScore: number;
  infrastructureScore: number;
  issueScore: number;
  timeScore: number;
  overallScore: number;
  grade: string;
  factors: {
    crimeRate: number;
    streetlights: number;
    policeBooths: number;
    activeIssues: number;
    resolvedIssues: number;
    isNighttime: boolean;
  };
}

interface AreaScore {
  area: string;
  lat: number;
  lng: number;
  overallScore: number;
  grade: string;
  crimeScore: number;
  infrastructureScore: number;
  crimeData: {
    crimeRate: number;
    zone: string;
  };
}

const API_BASE_URL = 'http://localhost:3000/api';

const SafetyScoreDashboardEnhanced: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 12.9716,
    lng: 77.5946,
    name: 'Bengaluru Center'
  });
  const [currentScore, setCurrentScore] = useState<SafetyScore | null>(null);
  const [areaScores, setAreaScores] = useState<AreaScore[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'rankings'>('overview');
  const [simulationParams, setSimulationParams] = useState({
    addStreetlights: 0,
    addPoliceBooths: 0,
    fixIssues: 0
  });
  const [showSimulationResult, setShowSimulationResult] = useState(false);

  // Fetch current safety score
  const fetchSafetyScore = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/safety-score/calculate`, {
        params: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          radius: 1000
        }
      });
      setCurrentScore(response.data.data);
    } catch (error) {
      console.error('Error fetching safety score:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all area scores
  const fetchAreaScores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/safety-score/areas`);
      setAreaScores(response.data.data.areas);
    } catch (error) {
      console.error('Error fetching area scores:', error);
    }
  };

  // Run simulation
  const runSimulation = async () => {
    setLoading(true);
    setShowSimulationResult(false);
    try {
      const response = await axios.post(`${API_BASE_URL}/safety-score/simulate`, {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius: 1000,
        changes: simulationParams
      });
      setSimulation(response.data.data);
      setShowSimulationResult(true);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyScore();
    fetchAreaScores();
  }, [selectedLocation]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
    if (grade.startsWith('B')) return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
    if (grade.startsWith('C')) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
  };

  const CircularProgress = ({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${getScoreTextColor(score)} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getScoreTextColor(score)}`}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
    );
  };

  const ScoreBar = ({ label, score, icon }: { label: string; score: number; icon: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span>{icon}</span>
          {label}
        </span>
        <span className={`text-sm font-bold ${getScoreTextColor(score)}`}>{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Safety Score Analytics
              </h1>
              <p className="text-gray-600 mt-2">Real-time safety analysis for Bengaluru</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Location Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📍 Select Location
          </label>
          <select
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg font-medium"
            value={selectedLocation.name}
            onChange={(e) => {
              const area = areaScores.find(a => a.area === e.target.value);
              if (area) {
                setSelectedLocation({
                  lat: area.lat,
                  lng: area.lng,
                  name: area.area
                });
                setShowSimulationResult(false);
              }
            }}
          >
            <option value="Bengaluru Center">Bengaluru Center</option>
            {areaScores.map(area => (
              <option key={area.area} value={area.area}>{area.area}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'simulation', label: '🔮 Simulation', icon: '🔮' },
            { id: 'rankings', label: '🏆 Rankings', icon: '🏆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && currentScore && !loading && (
          <div className="space-y-8 animate-fadeIn">
            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 border border-blue-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Circular Score */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">Overall Safety Score</h2>
                  <CircularProgress score={currentScore.overallScore} size={180} strokeWidth={12} />
                  <div className={`px-6 py-3 rounded-full text-xl font-bold shadow-lg ${getGradeBadgeColor(currentScore.grade)}`}>
                    Grade: {currentScore.grade}
                  </div>
                  <p className="text-gray-600 text-center max-w-md">
                    {currentScore.overallScore >= 80 ? '✅ Excellent safety conditions' :
                     currentScore.overallScore >= 60 ? '⚠️ Moderate safety - improvements recommended' :
                     '🚨 Safety concerns - immediate action needed'}
                  </p>
                </div>

                {/* Right: Score Breakdown */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Score Breakdown</h3>
                  <ScoreBar label="Crime Safety" score={currentScore.crimeScore} icon="🚔" />
                  <ScoreBar label="Infrastructure" score={currentScore.infrastructureScore} icon="💡" />
                  <ScoreBar label="Issue Management" score={currentScore.issueScore} icon="🔧" />
                  <ScoreBar label="Time Factor" score={currentScore.timeScore} icon="🕐" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">🚔</span>
                  <span className="text-3xl font-bold">{currentScore.factors.crimeRate.toFixed(1)}</span>
                </div>
                <h3 className="text-sm font-semibold opacity-90">Crime Rate</h3>
                <p className="text-xs opacity-75">per 1000 people/year</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">💡</span>
                  <span className="text-3xl font-bold">{currentScore.factors.streetlights}</span>
                </div>
                <h3 className="text-sm font-semibold opacity-90">Streetlights</h3>
                <p className="text-xs opacity-75">within 1km radius</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">🏢</span>
                  <span className="text-3xl font-bold">{currentScore.factors.policeBooths}</span>
                </div>
                <h3 className="text-sm font-semibold opacity-90">Police Booths</h3>
                <p className="text-xs opacity-75">within 1km radius</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">⚠️</span>
                  <span className="text-3xl font-bold">{currentScore.factors.activeIssues}</span>
                </div>
                <h3 className="text-sm font-semibold opacity-90">Active Issues</h3>
                <p className="text-xs opacity-75">{currentScore.factors.resolvedIssues} resolved</p>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔮</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Infrastructure Impact Simulator</h2>
                  <p className="text-gray-600">Predict how infrastructure changes affect safety scores</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    💡 Add Streetlights
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    value={simulationParams.addStreetlights}
                    onChange={(e) => setSimulationParams({
                      ...simulationParams,
                      addStreetlights: parseInt(e.target.value)
                    })}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-yellow-600">{simulationParams.addStreetlights}</span>
                    <span className="text-sm text-gray-500">lights</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    🏢 Add Police Booths
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    value={simulationParams.addPoliceBooths}
                    onChange={(e) => setSimulationParams({
                      ...simulationParams,
                      addPoliceBooths: parseInt(e.target.value)
                    })}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{simulationParams.addPoliceBooths}</span>
                    <span className="text-sm text-gray-500">booths</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    🔧 Fix Issues
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    value={simulationParams.fixIssues}
                    onChange={(e) => setSimulationParams({
                      ...simulationParams,
                      fixIssues: parseInt(e.target.value)
                    })}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">{simulationParams.fixIssues}</span>
                    <span className="text-sm text-gray-500">issues</span>
                  </div>
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running Simulation...
                  </span>
                ) : (
                  '🚀 Run Simulation'
                )}
              </button>

              {showSimulationResult && simulation && (
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 animate-slideIn">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>📊</span> Simulation Results
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Before</h4>
                      <div className="flex items-center justify-center mb-3">
                        <CircularProgress score={simulation.before.overallScore} size={100} strokeWidth={8} />
                      </div>
                      <div className={`text-center px-4 py-2 rounded-full text-sm font-bold ${getGradeBadgeColor(simulation.before.grade)}`}>
                        Grade {simulation.before.grade}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${simulation.improvement > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {simulation.improvement > 0 ? '↑' : '→'} {Math.abs(simulation.improvement)}
                        </div>
                        <p className="text-sm text-gray-600 font-semibold">points improvement</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">After</h4>
                      <div className="flex items-center justify-center mb-3">
                        <CircularProgress score={simulation.after.overallScore} size={100} strokeWidth={8} />
                      </div>
                      <div className={`text-center px-4 py-2 rounded-full text-sm font-bold ${getGradeBadgeColor(simulation.after.grade)}`}>
                        Grade {simulation.after.grade}
                      </div>
                    </div>
                  </div>

                  {simulation.recommendations && simulation.recommendations.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>💡</span> Recommendations
                      </h4>
                      <ul className="space-y-3">
                        {simulation.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🏆</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Bengaluru Area Safety Rankings</h2>
                  <p className="text-gray-600">Ranked by overall safety score</p>
                </div>
              </div>

              <div className="space-y-4">
                {areaScores.map((area, index) => (
                  <div
                    key={area.area}
                    onClick={() => {
                      setSelectedLocation({ lat: area.lat, lng: area.lng, name: area.area });
                      setActiveTab('overview');
                    }}
                    className="group bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-purple-50 rounded-xl p-6 border-2 border-gray-100 hover:border-blue-300 cursor-pointer transition-all duration-300 transform hover:scale-102 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Area Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {area.area}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {area.crimeData.zone} Zone • Crime Rate: {area.crimeData.crimeRate.toFixed(1)}/1000
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreTextColor(area.overallScore)}`}>
                          {area.overallScore}
                        </div>
                        <div className={`mt-2 px-4 py-1 rounded-full text-sm font-bold ${getGradeBadgeColor(area.grade)}`}>
                          {area.grade}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && activeTab === 'overview' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 font-semibold">Loading safety data...</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SafetyScoreDashboardEnhanced;
