/**
 * A simple test framework for JavaScript courses with enhanced visual feedback
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Global test results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  groups: {},
  startTime: 0,
  endTime: 0
};

// Add a visual legend at the beginning to help beginners understand the output
console.log(`\n${colors.bgWhite}${colors.black}${colors.bright} 🧪 TEST GUIDE FOR BEGINNERS ${colors.reset}`);
console.log(`   ${colors.green}✅${colors.reset} = Test passed successfully`);
console.log(`   ${colors.red}❌${colors.reset} = Test failed (needs your attention)`);
console.log(`   ${colors.yellow}💡${colors.reset} = Helpful hint to fix an issue`);
console.log(`   ${colors.cyan}📋${colors.reset} = Group of related tests`);
console.log(`   ${colors.magenta}📊${colors.reset} = Summary of test results`);
console.log(`${colors.bgWhite}${colors.black}${colors.bright}${'─'.repeat(50)}${colors.reset}\n`);

// Simple implementation of describe and it functions
global.describe = function(description, callback) {
  testResults.groups[description] = {
    name: description,
    tests: [],
    passed: 0,
    failed: 0
  };
  
  const groupName = description.toUpperCase();
  
  // Create a colorful and visually distinctive header for each test group
  const headerColor = colors.bgBlue + colors.white + colors.bright;
  const headerWidth = 60;
  const padding = Math.max(0, Math.floor((headerWidth - groupName.length - 6) / 2));
  
  console.log(`\n${headerColor}${'═'.repeat(headerWidth)}${colors.reset}`);
  console.log(`${headerColor}${' '.repeat(padding)} 📋 ${groupName} ${' '.repeat(padding)}${colors.reset}`);
  console.log(`${headerColor}${'═'.repeat(headerWidth)}${colors.reset}`);
  
  testResults.startTime = Date.now();
  callback();
  testResults.endTime = Date.now();
};

global.it = function(testName, callback) {
  const currentGroup = Object.keys(testResults.groups).pop();
  testResults.total++;
  
  // Create a unique test identifier for easier reference
  const testId = `T${testResults.total.toString().padStart(2, '0')}`;
  
  try {
    callback();
    // Use a visual marker (checkmark + testname) that clearly stands out
    console.log(`   ${colors.green}✅ ${colors.bright}[${testId}] ${testName}${colors.reset}`);
    testResults.passed++;
    
    if (currentGroup) {
      testResults.groups[currentGroup].passed++;
      testResults.groups[currentGroup].tests.push({
        name: testName,
        passed: true,
        id: testId
      });
    }
  } catch (error) {
    // Use a visual marker (X + testname) that clearly stands out
    console.log(`   ${colors.red}❌ ${colors.bright}[${testId}] ${testName}${colors.reset}`);
    
    // Format the error message to make it more readable
    const formattedError = error.message
      .replace(/expected/gi, `${colors.yellow}expected${colors.red}`)
      .replace(/to equal/gi, `${colors.yellow}to equal${colors.red}`)
      .replace(/to be/gi, `${colors.yellow}to be${colors.red}`);
    
    console.log(`     ${colors.red}${colors.dim}Error: ${formattedError}${colors.reset}`);
    
    // Add more specific and helpful hints based on error patterns
    if (error.message.includes('Expected') && error.message.includes('to equal')) {
      console.log(`     ${colors.yellow}💡 Hint: Your function returned a different value than expected.${colors.reset}`);
      console.log(`       ${colors.yellow}Check your calculations or return statement.${colors.reset}`);
    } else if (error.message.includes('is not a function')) {
      console.log(`     ${colors.yellow}💡 Hint: You might have a typo in a function name or didn't define it properly.${colors.reset}`);
      console.log(`       ${colors.yellow}Double-check the spelling of function names in your code.${colors.reset}`);
    } else if (error.message.includes('Cannot read property') || error.message.includes('undefined')) {
      console.log(`     ${colors.yellow}💡 Hint: You're trying to access a property of something that doesn't exist.${colors.reset}`);
      console.log(`       ${colors.yellow}Check if variables are initialized before using them.${colors.reset}`);
    } else if (error.message.includes('TypeError')) {
      console.log(`     ${colors.yellow}💡 Hint: You're using a value of the wrong type.${colors.reset}`);
      console.log(`       ${colors.yellow}Check if you need to convert between strings, numbers, etc.${colors.reset}`);
    }
    
    testResults.failed++;
    testResults.failures.push({ 
      name: testName, 
      error: error.message,
      id: testId 
    });
    
    if (currentGroup) {
      testResults.groups[currentGroup].failed++;
      testResults.groups[currentGroup].tests.push({
        name: testName,
        passed: false,
        error: error.message,
        id: testId
      });
    }
  }
};

// Simple implementation of assert methods
const assert = require('assert');
global.assert = assert;

// Process exit handler
process.on('exit', () => {
  // Calculate duration
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  // Create a visual progress bar with improved styling
  const totalWidth = 30;
  const passedWidth = Math.round((testResults.passed / testResults.total) * totalWidth);
  const failedWidth = totalWidth - passedWidth;
  
  // Percentage of passing tests
  const passPercent = Math.round((testResults.passed / testResults.total) * 100);
  
  // Create a colorful progress bar with labels
  const progressBar = 
    `${colors.green}${colors.bright}PASS ${passPercent}%${colors.reset} ` +
    colors.bgGreen + ' '.repeat(passedWidth) + colors.reset +
    colors.bgRed + ' '.repeat(failedWidth) + colors.reset +
    ` ${colors.red}${colors.bright}FAIL ${100-passPercent}%${colors.reset}`;
  
  // Create a colored divider based on pass/fail status
  const coloredDivider = testResults.failed === 0 
    ? `${colors.bgGreen}${colors.bright}${colors.white}` + '═'.repeat(60) + `${colors.reset}`
    : `${colors.bgYellow}${colors.bright}${colors.black}` + '═'.repeat(60) + `${colors.reset}`;
    
  // Create a fancy header for the summary
  console.log(`\n${coloredDivider}`);
  console.log(`${colors.bright}${colors.bgCyan}${colors.white} 📊 TEST RESULTS SUMMARY ${colors.reset}`);
  console.log(`${coloredDivider}`);
  
  // Show progress bar with clear labeling
  console.log(`\n   ${progressBar}`);
  
  // Show detailed statistics with colorful formatting
  console.log(`\n   ${colors.bright}${colors.white}📌 Statistics:${colors.reset}`);
  console.log(`   ${colors.bright}Total Tests:${colors.reset} ${colors.white}${testResults.total}${colors.reset}`);
  console.log(`   ${colors.green}✅ Passed:${colors.reset} ${colors.green}${testResults.passed}${colors.reset}`);
  console.log(`   ${colors.red}❌ Failed:${colors.reset} ${colors.red}${testResults.failed}${colors.reset}`);
  console.log(`   ${colors.blue}⏱️ Duration:${colors.reset} ${colors.blue}${duration.toFixed(2)} seconds${colors.reset}`);
  
  // If any tests failed, show details
  if (testResults.failed > 0) {
    console.log(`\n${colors.bgRed}${colors.white}${colors.bright} 🔍 FAILED TESTS DETAILS ${colors.reset}`);
    
    // Group failures by test group for better organization
    const failuresByGroup = {};
    Object.keys(testResults.groups).forEach(groupName => {
      const group = testResults.groups[groupName];
      const failedTests = group.tests.filter(test => !test.passed);
      if (failedTests.length > 0) {
        failuresByGroup[groupName] = failedTests;
      }
    });
    
    // Show failures grouped by test section
    Object.keys(failuresByGroup).forEach(groupName => {
      console.log(`\n   ${colors.yellow}${colors.bright}${groupName}:${colors.reset}`);
      failuresByGroup[groupName].forEach(failure => {
        console.log(`   ${colors.red}• ${failure.name}${colors.reset}`);
        if (failure.error) {
          console.log(`     ${colors.red}${colors.dim}Error: ${failure.error}${colors.reset}`);
        }
      });
    });
    
    // Add a visual divider before hints
    console.log(`\n${colors.bgYellow}${colors.black}${colors.bright} 💡 BEGINNER'S GUIDE TO FIXING TESTS ${colors.reset}`);
    console.log(`\n   ${colors.bright}${colors.yellow}Step 1:${colors.reset} ${colors.white}Understand the error messages${colors.reset}`);
    console.log(`     Look at each error message carefully - they tell you exactly what's wrong`);
    console.log(`\n   ${colors.bright}${colors.yellow}Step 2:${colors.reset} ${colors.white}Check your code against requirements${colors.reset}`);
    console.log(`     Make sure your solution meets all the requirements in the exercise`);
    console.log(`\n   ${colors.bright}${colors.yellow}Step 3:${colors.reset} ${colors.white}Fix one problem at a time${colors.reset}`);
    console.log(`     Don't try to fix everything at once - tackle one error, then run tests again`);
    console.log(`\n   ${colors.bright}${colors.yellow}Step 4:${colors.reset} ${colors.white}Try again${colors.reset}`);
    console.log(`     Run the tests again after each fix to see your progress`);
    
    // Add a common error dictionary for beginners
    console.log(`\n${colors.bgMagenta}${colors.white}${colors.bright} 📖 COMMON ERRORS EXPLAINED ${colors.reset}`);
    console.log(`\n   ${colors.magenta}• "Expected X to equal Y"${colors.reset}: Your function returned a different value than expected`);
    console.log(`   ${colors.magenta}• "is not a function"${colors.reset}: You may have a typo in a function name or didn't define it correctly`);
    console.log(`   ${colors.magenta}• "Cannot read property of undefined"${colors.reset}: You're trying to access something that doesn't exist`);
    console.log(`   ${colors.magenta}• "Unexpected token"${colors.reset}: You might have a syntax error like a missing bracket`);
    
    process.exit(1); // Exit with error if any tests failed
  } else {
    console.log(`\n${colors.bgGreen}${colors.white}${colors.bright} 🎉 CONGRATULATIONS! ALL TESTS PASSED! ${colors.reset}`);
    
    // Show a celebration message with emojis for visual appeal
    console.log(`\n   ${colors.green}${colors.bright}🏆 You've successfully completed all the tests! 🏆${colors.reset}`);
    console.log(`   ${colors.green}Your code works perfectly as expected!${colors.reset}`);
    
    console.log(`\n${colors.bgBlue}${colors.white}${colors.bright} 🚀 NEXT STEPS ${colors.reset}`);
    console.log(`\n   ${colors.blue}• Move on to the next module${colors.reset}`);
    console.log(`   ${colors.blue}• Challenge yourself: try to optimize your solution${colors.reset}`);
    console.log(`   ${colors.blue}• Review what you've learned from this exercise${colors.reset}`);
    console.log(`   ${colors.blue}• Share your success with others!${colors.reset}`);
  }
});

module.exports = { describe, it, assert };