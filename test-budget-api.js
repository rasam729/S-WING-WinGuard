/**
 * Test Script for Budget Tracking API
 * Run with: node test-budget-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// ANSI color codes
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

async function testInfrastructureCosts() {
  logSection('TEST 1: Get Infrastructure Costs');
  
  try {
    const response = await axios.get(`${API_BASE}/budget/infrastructure-costs`);
    
    log('✓ API call successful', 'green');
    console.log('\nInfrastructure Costs (INR):');
    const costs = response.data.data.costs;
    
    console.log('\n  Streetlight:');
    console.log(`    Installation: ₹${costs.streetlight.installation.toLocaleString('en-IN')}`);
    console.log(`    Maintenance: ₹${costs.streetlight.maintenance.toLocaleString('en-IN')}`);
    console.log(`    Electricity: ₹${costs.streetlight.electricity.toLocaleString('en-IN')}/month`);
    
    console.log('\n  Police Booth:');
    console.log(`    Installation: ₹${costs.police_booth.installation.toLocaleString('en-IN')}`);
    console.log(`    Maintenance: ₹${costs.police_booth.maintenance.toLocaleString('en-IN')}`);
    console.log(`    Staffing: ₹${costs.police_booth.staffing.toLocaleString('en-IN')}/month`);
    
    console.log('\n  CCTV:');
    console.log(`    Installation: ₹${costs.cctv.installation.toLocaleString('en-IN')}`);
    console.log(`    Maintenance: ₹${costs.cctv.maintenance.toLocaleString('en-IN')}`);
    console.log(`    Monitoring: ₹${costs.cctv.monitoring.toLocaleString('en-IN')}/month`);
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    return false;
  }
}

async function testCalculateInfrastructure() {
  logSection('TEST 2: Calculate Infrastructure Cost');
  
  try {
    const response = await axios.post(`${API_BASE}/budget/calculate-infrastructure`, {
      type: 'streetlight',
      quantity: 5
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nCost for 5 Streetlights:');
    console.log(`  Unit Cost: ${data.formatted.unitCost}`);
    console.log(`  Total Cost: ${data.formatted.totalCost}`);
    console.log(`  Monthly Recurring: ${data.formatted.monthlyRecurring}`);
    console.log(`  Yearly Recurring: ${data.formatted.yearlyRecurring}`);
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    return false;
  }
}

async function testCalculateSimulation() {
  logSection('TEST 3: Calculate Simulation Budget');
  
  try {
    const response = await axios.post(`${API_BASE}/budget/calculate-simulation`, {
      addStreetlights: 5,
      addPoliceBooths: 2,
      fixIssues: 3
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nSimulation Budget:');
    console.log(`  Changes: 5 streetlights, 2 police booths, 3 issue fixes`);
    console.log(`\n  One-Time Cost: ${data.formatted.totalOneTimeCost}`);
    console.log(`  Monthly Recurring: ${data.formatted.totalMonthlyRecurring}`);
    console.log(`  Yearly Recurring: ${data.formatted.totalYearlyRecurring}`);
    console.log(`  First Year Total: ${data.formatted.totalFirstYearCost}`);
    
    console.log('\n  Items:');
    data.items.forEach(item => {
      console.log(`    • ${item.itemName} (${item.quantity}): ₹${item.totalCost.toLocaleString('en-IN')}`);
    });
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    return false;
  }
}

async function testBudgetRecommendations() {
  logSection('TEST 4: Get Budget Recommendations');
  
  try {
    const response = await axios.post(`${API_BASE}/budget/recommendations`, {
      availableBudget: 500000,
      priorityArea: 'safety'
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log(`\nAvailable Budget: ${data.formatted}`);
    console.log(`Priority Area: ${data.priorityArea}`);
    console.log('\nRecommendations:');
    data.recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    return false;
  }
}

async function testCompareOptions() {
  logSection('TEST 5: Compare Budget Options');
  
  try {
    const response = await axios.post(`${API_BASE}/budget/compare-options`, {
      options: [
        {
          name: 'Option A: Focus on Lighting',
          changes: { addStreetlights: 10, addPoliceBooths: 0, fixIssues: 0 }
        },
        {
          name: 'Option B: Focus on Security',
          changes: { addStreetlights: 0, addPoliceBooths: 3, fixIssues: 0 }
        },
        {
          name: 'Option C: Balanced Approach',
          changes: { addStreetlights: 5, addPoliceBooths: 1, fixIssues: 5 }
        }
      ]
    });
    
    const data = response.data.data;
    log('✓ API call successful', 'green');
    console.log('\nBudget Comparison:');
    
    data.comparisons.forEach((comp, idx) => {
      console.log(`\n  ${idx + 1}. ${comp.name}`);
      console.log(`     One-Time: ${comp.budget.formatted.totalOneTimeCost}`);
      console.log(`     First Year: ${comp.budget.formatted.totalFirstYearCost}`);
    });
    
    console.log(`\n  Cheapest: ${data.cheapest.name}`);
    console.log(`  Most Expensive: ${data.mostExpensive.name}`);
    
    return true;
  } catch (error) {
    log('✗ Test failed: ' + error.message, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Budget Tracking API Tests', 'blue');
  log('Make sure the server is running on http://localhost:3000\n', 'yellow');
  
  const results = [];
  
  results.push(await testInfrastructureCosts());
  results.push(await testCalculateInfrastructure());
  results.push(await testCalculateSimulation());
  results.push(await testBudgetRecommendations());
  results.push(await testCompareOptions());
  
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
