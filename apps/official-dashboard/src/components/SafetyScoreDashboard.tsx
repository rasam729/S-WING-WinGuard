/**
 * Safety Score Dashboard Component
 * Enhanced UI/UX with modern design, animations, and visualizations
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
  crimeData: {
    crimeRate: number;
    zone: string;
  };
}

const API_BASE_URL = 'http://localhost:3000/api';

const SafetyScoreDashboard: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 12.9716,
    lng: 77.5946,
    name: 'Bengaluru Center'
  });
  const [currentScore, setCurrentScore] = useState<SafetyScore | null>(null);
  const [areaScores, setAreaScores] = useState<AreaScore[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    addStreetlights: 0,
    addPoliceBooths: 0,
    fixIssues: 0
  });

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
    try {
      const response = await axios.post(`${API_BASE_URL}/safety-score/simulate`, {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius: 1000,
        changes: simulationParams
      });
      setSimulation(response.data.data);
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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Safety Score & Analytics Dashboard
        </h1>

        {/* Current Location Score */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Current Location Analysis</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedLocation.name}
              onChange={(e) => {
                const area = areaScores.find(a => a.area === e.target.value);
                if (area) {
                  setSelectedLocation({
                    lat: area.lat,
                    lng: area.lng,
                    name: area.area
                  });
                }
              }}
            >
              <option value="Bengaluru Center">Bengaluru Center</option>
              {areaScores.map(area => (
                <option key={area.area} value={area.area}>{area.area}</option>
              ))}
            </select>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}

          {currentScore && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Score</h3>
                <div className={`text-4xl font-bold ${getScoreColor(currentScore.overallScore)}`}>
                  {currentScore.overallScore}
                </div>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(currentScore.grade)}`}>
                  Grade: {currentScore.grade}
                </span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Crime Score</h3>
                <div className={`text-4xl font-bold ${getScoreColor(currentScore.crimeScore)}`}>
                  {currentScore.crimeScore}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Crime Rate: {currentScore.factors.crimeRate.toFixed(1)}/1000
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Infrastructure</h3>
                <div className={`text-4xl font-bold ${getScoreColor(currentScore.infrastructureScore)}`}>
                  {currentScore.infrastructureScore}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {currentScore.factors.streetlights} lights, {currentScore.factors.policeBooths} booths
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Issue Score</h3>
                <div className={`text-4xl font-bold ${getScoreColor(currentScore.issueScore)}`}>
                  {currentScore.issueScore}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {currentScore.factors.activeIssues} active, {currentScore.factors.resolvedIssues} resolved
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Simulation Tool */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Infrastructure Impact Simulator</h2>
          <p className="text-gray-600 mb-4">
            Simulate how adding infrastructure or fixing issues affects the safety score
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Streetlights
              </label>
              <input
                type="number"
                min="0"
                max="20"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={simulationParams.addStreetlights}
                onChange={(e) => setSimulationParams({
                  ...simulationParams,
                  addStreetlights: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Police Booths
              </label>
              <input
                type="number"
                min="0"
                max="10"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={simulationParams.addPoliceBooths}
                onChange={(e) => setSimulationParams({
                  ...simulationParams,
                  addPoliceBooths: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fix Issues
              </label>
              <input
                type="number"
                min="0"
                max="50"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={simulationParams.fixIssues}
                onChange={(e) => setSimulationParams({
                  ...simulationParams,
                  fixIssues: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>

          {simulation && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Before</h4>
                  <div className={`text-3xl font-bold ${getScoreColor(simulation.before.overallScore)}`}>
                    {simulation.before.overallScore}
                  </div>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${getGradeColor(simulation.before.grade)}`}>
                    {simulation.before.grade}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">After</h4>
                  <div className={`text-3xl font-bold ${getScoreColor(simulation.after.overallScore)}`}>
                    {simulation.after.overallScore}
                  </div>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${getGradeColor(simulation.after.grade)}`}>
                    {simulation.after.grade}
                  </span>
                </div>
              </div>

              <div className={`text-center p-3 rounded-lg ${simulation.improvement > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                <span className="text-lg font-semibold">
                  {simulation.improvement > 0 ? '↑' : '→'} {Math.abs(simulation.improvement)} points improvement
                </span>
              </div>

              {simulation.recommendations && simulation.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {simulation.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Area Rankings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Bengaluru Area Safety Rankings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crime Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {areaScores.map((area, index) => (
                  <tr key={area.area} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLocation({ lat: area.lat, lng: area.lng, name: area.area })}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {area.area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(area.overallScore)}`}>
                        {area.overallScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(area.grade)}`}>
                        {area.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {area.crimeData.crimeRate.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {area.crimeData.zone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyScoreDashboard;
