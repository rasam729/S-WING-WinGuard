/**
 * Test Script for Safety Score API
 * Run with: node test-safety-score-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testCalculateSafetyScore() {
  logSection('TEST 1: Calculate Safety Score for Indiranagar');
  
  try {
    const response = await axios.get(`${API_BASE}/safety-score/calculate`, {
      params: {
        lat: 12.9716,
        lng: 77.5946,
        radius: 1000
      }
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nResults:');
    console.log(`  Location: ${data.location.latitude}, ${data.location.longitude}`);
    console.log(`  Overall Score: ${data.overallScore} (Grade: ${data.grade})`);
    console.log(`  Crime Score: ${data.crimeScore}`);
    console.log(`  Infrastructure Score: ${data.infrastructureScore}`);
    console.log(`  Issue Score: ${data.issueScore}`);
    console.log(`  Time Score: ${data.timeScore}`);
    console.log('\nFactors:');
    console.log(`  Crime Rate: ${data.factors.crimeRate}/1000`);
    console.log(`  Streetlights: ${data.factors.streetlights}`);
    console.log(`  Police Booths: ${data.factors.policeBooths}`);
    console.log(`  Active Issues: ${data.factors.activeIssues}`);
    console.log(`  Resolved Issues: ${data.factors.resolvedIssues}`);
    console.log(`  Nighttime: ${data.factors.isNighttime}`);
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

async function testGetAllAreas() {
  logSection('TEST 2: Get All Bengaluru Area Scores');
  
  try {
    const response = await axios.get(`${API_BASE}/safety-score/areas`);
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log(`\nTotal Areas: ${data.totalAreas}`);
    console.log('\nTop 5 Safest Areas:');
    
    data.areas.slice(0, 5).forEach((area, index) => {
      console.log(`  ${index + 1}. ${area.area}: ${area.overallScore} (${area.grade}) - Crime Rate: ${area.crimeData.crimeRate}`);
    });
    
    console.log('\nBottom 5 Areas:');
    data.areas.slice(-5).forEach((area, index) => {
      console.log(`  ${data.totalAreas - 4 + index}. ${area.area}: ${area.overallScore} (${area.grade}) - Crime Rate: ${area.crimeData.crimeRate}`);
    });
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

async function testSimulation() {
  logSection('TEST 3: Simulate Infrastructure Improvements');
  
  try {
    const response = await axios.post(`${API_BASE}/safety-score/simulate`, {
      lat: 12.9352,
      lng: 77.6245,
      radius: 1000,
      changes: {
        addStreetlights: 5,
        addPoliceBooths: 2,
        fixIssues: 3
      }
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nSimulation for Koramangala:');
    console.log(`  Changes: +5 streetlights, +2 police booths, -3 issues`);
    console.log('\nBefore:');
    console.log(`  Score: ${data.before.overallScore} (${data.before.grade})`);
    console.log(`  Infrastructure: ${data.before.infrastructureScore}`);
    console.log(`  Streetlights: ${data.before.factors.streetlights}`);
    console.log(`  Police Booths: ${data.before.factors.policeBooths}`);
    console.log('\nAfter:');
    console.log(`  Score: ${data.after.overallScore} (${data.after.grade})`);
    console.log(`  Infrastructure: ${data.after.infrastructureScore}`);
    console.log(`  Streetlights: ${data.after.factors.streetlights}`);
    console.log(`  Police Booths: ${data.after.factors.policeBooths}`);
    
    const color = data.improvement > 0 ? 'green' : 'yellow';
    log(`\n  Improvement: ${data.improvement > 0 ? '+' : ''}${data.improvement} points`, color);
    
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\nRecommendations:');
      data.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

async function testCrimeData() {
  logSection('TEST 4: Get Crime Data');
  
  try {
    const response = await axios.get(`${API_BASE}/safety-score/crime-data`);
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log(`\nTotal Areas: ${data.totalAreas}`);
    console.log(`Average Crime Rate: ${data.averageCrimeRate.toFixed(2)}/1000`);
    console.log('\nCrime Data by Severity:');
    
    const high = data.crimeData.filter(d => d.severity === 'High');
    const medium = data.crimeData.filter(d => d.severity === 'Medium');
    const low = data.crimeData.filter(d => d.severity === 'Low');
    
    console.log(`\n  High Crime Areas (${high.length}):`);
    high.forEach(d => console.log(`    • ${d.area}: ${d.crimeRate}/1000 (${d.zone} Zone)`));
    
    console.log(`\n  Medium Crime Areas (${medium.length}):`);
    medium.forEach(d => console.log(`    • ${d.area}: ${d.crimeRate}/1000 (${d.zone} Zone)`));
    
    console.log(`\n  Low Crime Areas (${low.length}):`);
    low.forEach(d => console.log(`    • ${d.area}: ${d.crimeRate}/1000 (${d.zone} Zone)`));
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

async function testCompareLocations() {
  logSection('TEST 5: Compare Multiple Locations');
  
  try {
    const response = await axios.post(`${API_BASE}/safety-score/compare`, {
      locations: [
        { name: 'Koramangala (High Crime)', lat: 12.9352, lng: 77.6245 },
        { name: 'Basavanagudi (Low Crime)', lat: 12.9423, lng: 77.5742 },
        { name: 'Indiranagar (Medium-High)', lat: 12.9716, lng: 77.5946 }
      ]
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nComparison Results:');
    
    data.comparisons.forEach((comp, index) => {
      console.log(`\n  ${index + 1}. ${comp.name}`);
      console.log(`     Score: ${comp.overallScore} (${comp.grade})`);
      console.log(`     Crime: ${comp.crimeScore}, Infrastructure: ${comp.infrastructureScore}, Issues: ${comp.issueScore}`);
    });
    
    console.log('\nSummary:');
    log(`  Safest: ${data.safest.name} (${data.safest.overallScore})`, 'green');
    log(`  Least Safe: ${data.leastSafe.name} (${data.leastSafe.overallScore})`, 'yellow');
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Safety Score API Tests', 'blue');
  log('Make sure the server is running on http://localhost:3000\n', 'yellow');
  
  const results = [];
  
  results.push(await testCalculateSafetyScore());
  results.push(await testGetAllAreas());
  results.push(await testSimulation());
  results.push(await testCrimeData());
  results.push(await testCompareLocations());
  
  logSection('TEST SUMMARY');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`✓ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`✗ Some tests failed (${passed}/${total})`, 'red');
  }
  
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  log('\n✗ Fatal error: ' + error.message, 'red');
  process.exit(1);
});
