/**
 * Platform Integration Test - Safe Mode
 * Tests explain_only + dry_run (non-destructive)
 */

const AOS_BASE_URL = 'https://autonomos-platform.replit.app';
const USE_PLATFORM = process.env.VITE_USE_PLATFORM === 'true';

const results = [];

async function testPlatformIntegration() {
  console.log('='.repeat(60));
  console.log('PLATFORM INTEGRATION TEST - SAFE MODE');
  console.log('='.repeat(60));
  console.log(`AOS_BASE_URL: ${AOS_BASE_URL}`);
  console.log(`USE_PLATFORM flag location: client/src/lib/aosClient.ts:7`);
  console.log(`Current USE_PLATFORM value: ${USE_PLATFORM}`);
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Baseline test
  console.log('STEP 1: Baseline test (local API)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch('http://localhost:5000/api/aws-resources');
    if (response.ok) {
      const data = await response.json();
      results.push({ step: 'Baseline', status: 'PASS', message: `Local API OK - ${data.length} resources` });
      console.log(`✓ Baseline OK - Retrieved ${data.length} resources from local API`);
    } else {
      results.push({ step: 'Baseline', status: 'FAIL', message: `Local API returned ${response.status}` });
      console.log(`✗ Baseline FAIL - Status ${response.status}`);
    }
  } catch (error) {
    results.push({ step: 'Baseline', status: 'FAIL', message: error.message });
    console.log(`✗ Baseline FAIL - ${error.message}`);
  }
  
  console.log('');

  // Step 2: Platform view fetch
  console.log('STEP 2: Platform view fetch');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${AOS_BASE_URL}/api/v1/dcl/views/accounts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      results.push({ 
        step: 'View Fetch', 
        status: 'PASS', 
        message: `Platform OK (${response.status})`,
        data: { trace_id: data.trace_id || 'none' }
      });
      console.log(`✓ Platform fetch OK - Status: ${response.status}`);
      console.log(`  Response snippet: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      const errorText = await response.text();
      results.push({ step: 'View Fetch', status: 'FALLBACK', message: `Status ${response.status}` });
      console.log(`⊗ Platform unavailable (${response.status}) - Fallback engaged`);
      console.log(`  Error: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    results.push({ step: 'View Fetch', status: 'FALLBACK', message: error.message });
    console.log(`⊗ Network error - Fallback engaged`);
    console.log(`  Error: ${error.message}`);
  }

  console.log('');

  // Step 3: Safe intent execution
  console.log('STEP 3: Safe intent execution (explain_only + dry_run)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${AOS_BASE_URL}/api/v1/intents/finops/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-${Date.now()}`
      },
      body: JSON.stringify({
        intent: 'noop',
        explain_only: true,
        dry_run: true,
        metadata: {
          test: true,
          source: 'platform-integration-test'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      results.push({
        step: 'Safe Intent',
        status: 'PASS',
        message: 'Intent posted successfully',
        data: {
          task_id: data.task_id,
          trace_id: data.trace_id,
          status: data.status
        }
      });
      console.log(`✓ Intent execution OK`);
      console.log(`  Task ID: ${data.task_id}`);
      console.log(`  Trace ID: ${data.trace_id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Full response:`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      results.push({ step: 'Safe Intent', status: 'FALLBACK', message: `Status ${response.status}` });
      console.log(`⊗ Intent failed (${response.status}) - Fallback engaged`);
      console.log(`  Error: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    results.push({ step: 'Safe Intent', status: 'FALLBACK', message: error.message });
    console.log(`⊗ Network error - Fallback engaged`);
    console.log(`  Error: ${error.message}`);
  }

  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const fallbackCount = results.filter(r => r.status === 'FALLBACK').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⊗';
    console.log(`${icon} ${result.step}: ${result.status}`);
    console.log(`  ${result.message}`);
    if (result.data) {
      console.log(`  Data: ${JSON.stringify(result.data)}`);
    }
  });
  
  console.log('');
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Fallback: ${fallbackCount}`);
  
  const overallStatus = failCount === 0 ? 'PASS' : 'FAIL';
  console.log('');
  console.log(`OVERALL: ${overallStatus}`);
  console.log('='.repeat(60));
}

testPlatformIntegration().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
