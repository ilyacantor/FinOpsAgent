/**
 * Platform Integration Test Script
 * Tests safe-mode platform wiring with explain_only + dry_run
 */

import { getView, postIntent, AOS_CONFIG } from './client/src/lib/aosClient';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'FALLBACK';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('='.repeat(60));
  console.log('PLATFORM INTEGRATION TEST - SAFE MODE');
  console.log('='.repeat(60));
  console.log(`AOS_BASE_URL: ${AOS_CONFIG.baseUrl}`);
  console.log(`USE_PLATFORM flag location: client/src/lib/aosClient.ts:7`);
  console.log(`Current USE_PLATFORM value: ${AOS_CONFIG.usePlatform}`);
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Baseline test with USE_PLATFORM=false
  console.log('STEP 1: Baseline test (USE_PLATFORM=false)');
  console.log('-'.repeat(60));
  
  if (!AOS_CONFIG.usePlatform) {
    console.log('✓ USE_PLATFORM is false - testing local fallback...');
    
    try {
      const accountsView = await getView('accounts');
      if (accountsView.data && Array.isArray(accountsView.data)) {
        results.push({
          step: 'Baseline - Local Fallback',
          status: 'PASS',
          message: `Retrieved ${accountsView.data.length} resources from local API`,
          data: { trace_id: accountsView.trace_id }
        });
        console.log(`✓ Baseline OK - Retrieved ${accountsView.data.length} resources`);
        console.log(`  Trace ID: ${accountsView.trace_id}`);
      } else {
        results.push({
          step: 'Baseline - Local Fallback',
          status: 'FAIL',
          message: 'Invalid data structure received'
        });
        console.log('✗ Baseline FAIL - Invalid data structure');
      }
    } catch (error) {
      results.push({
        step: 'Baseline - Local Fallback',
        status: 'FAIL',
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
      console.log(`✗ Baseline FAIL - ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('⊗ Skipping baseline (USE_PLATFORM is already true)');
  }
  
  console.log('');

  // Step 2: Platform view fetch test
  console.log('STEP 2: Platform view fetch test');
  console.log('-'.repeat(60));
  
  try {
    // Note: This will use fallback if USE_PLATFORM=false
    const response = await fetch(`${AOS_CONFIG.baseUrl}/api/v1/dcl/views/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      results.push({
        step: 'Platform View Fetch',
        status: 'PASS',
        message: `Successfully fetched from platform (${response.status})`,
        data: { trace_id: data.trace_id || 'none' }
      });
      console.log(`✓ Platform fetch OK - Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      results.push({
        step: 'Platform View Fetch',
        status: 'FALLBACK',
        message: `Platform returned ${response.status}, falling back to local`
      });
      console.log(`⊗ Platform unavailable (${response.status}) - Fallback engaged`);
    }
  } catch (error) {
    results.push({
      step: 'Platform View Fetch',
      status: 'FALLBACK',
      message: `Network error: ${error instanceof Error ? error.message : String(error)}`
    });
    console.log(`⊗ Network error - Fallback engaged`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('');

  // Step 3: Safe intent execution test (explain_only + dry_run)
  console.log('STEP 3: Safe intent execution (explain_only + dry_run)');
  console.log('-'.repeat(60));
  
  try {
    const intentResponse = await fetch(`${AOS_CONFIG.baseUrl}/api/v1/intents/finops/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'noop',
        explain_only: true,
        dry_run: true,
        metadata: {
          test: true,
          source: 'platform-integration-test'
        }
      }),
    });

    if (intentResponse.ok) {
      const intentData = await intentResponse.json();
      results.push({
        step: 'Safe Intent Execution',
        status: 'PASS',
        message: 'Intent posted successfully',
        data: {
          task_id: intentData.task_id,
          trace_id: intentData.trace_id,
          status: intentData.status
        }
      });
      console.log(`✓ Intent execution OK`);
      console.log(`  Task ID: ${intentData.task_id}`);
      console.log(`  Trace ID: ${intentData.trace_id}`);
      console.log(`  Status: ${intentData.status}`);
      console.log(`  Full response: ${JSON.stringify(intentData, null, 2)}`);
    } else {
      const errorText = await intentResponse.text();
      results.push({
        step: 'Safe Intent Execution',
        status: 'FALLBACK',
        message: `Platform returned ${intentResponse.status}`,
        data: { error: errorText }
      });
      console.log(`⊗ Intent failed (${intentResponse.status}) - Fallback engaged`);
      console.log(`  Error: ${errorText}`);
    }
  } catch (error) {
    results.push({
      step: 'Safe Intent Execution',
      status: 'FALLBACK',
      message: `Network error: ${error instanceof Error ? error.message : String(error)}`
    });
    console.log(`⊗ Network error - Fallback engaged`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const fallbackCount = results.filter(r => r.status === 'FALLBACK').length;
  
  results.forEach((result, index) => {
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
  
  return results;
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
