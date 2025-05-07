/**
 * A simple test framework for JavaScript courses
 */

// Global test results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

// Simple implementation of describe and it functions
global.describe = function(description, callback) {
  console.log(`\n📋 ${description}`);
  callback();
};

global.it = function(testName, callback) {
  testResults.total++;
  try {
    callback();
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.failures.push({ name: testName, error: error.message });
  }
};

// Simple implementation of assert methods
const assert = require('assert');
global.assert = assert;

// Process exit handler
process.on('exit', () => {
  console.log('\n📊 Test Summary:');
  console.log(`   Total: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    process.exit(1); // Exit with error if any tests failed
  }
});

module.exports = { describe, it, assert };