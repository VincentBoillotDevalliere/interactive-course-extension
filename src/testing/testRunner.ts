import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

/**
 * Checks if Mocha is available in the extension's node_modules
 */
function isMochaAvailable(): boolean {
  try {
    // Try to resolve mocha
    require.resolve('mocha');
    return true;
  } catch (error) {
    console.log('Mocha not available, using custom test framework');
    return false;
  }
}

export class TestRunner {
  // Cache the availability of Mocha
  private mochaAvailable: boolean = isMochaAvailable();
  
  constructor(private language: string) {}
  
  public async runTests(moduleId: string): Promise<boolean> {
    try {
      console.log(`[DEBUG] Finding test files for module ${moduleId}...`);
      
      // Use CourseUtils to find test files
      const { CourseUtils } = await import('../utils/courseUtils');
      const testFiles = await CourseUtils.findModuleTestFiles(moduleId);
      
      console.log(`[DEBUG] Found ${testFiles.length} potential test files for module ${moduleId}`);
      
      // If we have test files from CourseUtils, use them
      if (testFiles.length > 0) {
        for (const testFile of testFiles) {
          if (testFile.endsWith('.js') && this.language === 'javascript') {
            // Detect if we're using multi-file structure
            const dir = path.dirname(testFile);
            const exercisesDir = path.join(dir, 'exercises');
            const testsDir = path.join(dir, 'tests');
            
            if (fs.existsSync(exercisesDir) && fs.existsSync(testsDir)) {
              return await this.runJavaScriptMultiTests(dir, testFile);
            } else {
              return await this.runJavaScriptTests(testFile);
            }
          } else if (testFile.endsWith('.json')) {
            // Handle JSON exercise files
            const exercisesDir = path.dirname(testFile);
            return await this.runSplitExerciseTests(moduleId, exercisesDir);
          }
        }
      }
      
      // Fall back to the original method if CourseUtils didn't find anything
      
      // Find course directory (containing course.json)
      const files = await vscode.workspace.findFiles('**/course.json');
      
      // Look for the exercises directory structure in the assets
      const exerciseFiles = await vscode.workspace.findFiles(`**/assets/exercises/${moduleId}/*.json`);
      
      // Check for test files in potential course directory structure
      let potentialTestDirectories = [];
      
      if (files.length > 0) {
        const courseDir = path.dirname(files[0].fsPath);
        potentialTestDirectories.push(
          path.join(courseDir, moduleId),
          path.join(courseDir, 'tests', 'programming-course-javascript', moduleId)
        );
      }
      
      // Find potential test files in the workspace
      for (const dir of potentialTestDirectories) {
        const testFileExt = this.language === 'javascript' ? 'js' : 'py';
        const testFilePath = path.join(dir, `tests.${testFileExt}`);
        
        if (fs.existsSync(testFilePath)) {
          console.log(`[DEBUG] Found test file at: ${testFilePath}`);
          
          // Check if exercise directory structure exists
          const exercisesDir = path.join(dir, 'exercises');
          const testsDir = path.join(dir, 'tests');
          
          // If we have the multi-file structure
          if (fs.existsSync(exercisesDir) && fs.existsSync(testsDir)) {
            console.log(`[DEBUG] Using multi-file structure for module ${moduleId}`);
            if (this.language === 'javascript') {
              return await this.runJavaScriptMultiTests(dir, testFilePath);
            } 
          } else {
            // Fall back to the original single-file structure
            console.log(`[DEBUG] Using single-file structure for module ${moduleId}`);
            if (this.language === 'javascript') {
              return await this.runJavaScriptTests(testFilePath);
            } 
          }
        }
      }
      
      // If we're here, try to use the split exercise structure
      if (exerciseFiles.length > 0) {
        console.log(`[DEBUG] Found split exercise structure for module ${moduleId}`);
        const exercisesDir = path.dirname(exerciseFiles[0].fsPath);
        
        if (this.language === 'javascript') {
          return await this.runSplitExerciseTests(moduleId, exercisesDir);
        }
      }
      
      // If we've reached here, we couldn't find any test files
      vscode.window.showErrorMessage(`Could not find any test files for module ${moduleId}.`);
      return false;
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage(`Error finding test files: ${error}`);
      return false;
    }
  }
  
  private async runJavaScriptTests(testFilePath: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        // Create a temporary file that includes the test framework and imports the test file
        const tempTestFile = path.join(path.dirname(testFilePath), '_temp_test_runner.js');
        
        // Try to use Mocha if available, otherwise use our custom test framework
        let content = '';
        
        if (this.mochaAvailable) {
          console.log('[DEBUG] Using Mocha for test execution');
          content = `
// Temporary test runner file using Mocha
const Mocha = require('mocha');
const path = require('path');

// Create Mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Add test file
mocha.addFile('${testFilePath.replace(/\\/g, '\\\\')}');

// Run tests
mocha.run(failures => {
  process.exit(failures ? 1 : 0);
});
`;
        } else {
          console.log('[DEBUG] Using custom test framework');
          content = `
// Temporary test runner file with enhanced test framework

// ===== BEGIN ENHANCED TEST FRAMEWORK =====
// Global test results with more detailed tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  functionResults: {} // Track results by function
};

// Current function being tested
let currentFunction = 'unknown';

// Enhanced implementation of describe and it functions
global.describe = function(description, callback) {
  if (!description.includes('Tests')) {
    // This is likely a function describe block
    currentFunction = description;
    // Initialize tracking for this function
    if (!testResults.functionResults[currentFunction]) {
      testResults.functionResults[currentFunction] = {
        total: 0,
        passed: 0,
        failed: 0
      };
    }
  }
  console.log("\\n📋 " + description);
  callback();
};

global.it = function(testName, callback) {
  testResults.total++;
  
  // Also track per-function results
  if (testResults.functionResults[currentFunction]) {
    testResults.functionResults[currentFunction].total++;
  }
  
  try {
    callback();
    console.log("✅ " + testName);
    testResults.passed++;
    if (testResults.functionResults[currentFunction]) {
      testResults.functionResults[currentFunction].passed++;
    }
  } catch (error) {
    console.log("❌ " + testName);
    console.log("   Error: " + error.message);
    testResults.failed++;
    if (testResults.functionResults[currentFunction]) {
      testResults.functionResults[currentFunction].failed++;
    }
    testResults.failures.push({ 
      function: currentFunction,
      name: testName, 
      error: error.message 
    });
  }
};

// Simple implementation of assert methods
const assert = require('assert');
global.assert = assert;

// Process exit handler with enhanced reporting
process.on('exit', () => {
  console.log('\\n📊 Test Summary:');
  console.log(\`   Total: \${testResults.total} | ✅ Passed: \${testResults.passed} | ❌ Failed: \${testResults.failed}\`);
  
  // Report per-function results
  console.log('\\n📝 Function Details:');
  Object.keys(testResults.functionResults).forEach(func => {
    const result = testResults.functionResults[func];
    const status = result.failed > 0 ? '❌' : '✅';
    console.log(\`   \${status} \${func}: \${result.passed}/\${result.total} tests passed\`);
  });
  
  // Provide hint for failed tests
  if (testResults.failed > 0) {
    console.log('\\n🔍 Failed Tests:');
    testResults.failures.forEach(failure => {
      console.log(\`   • \${failure.function}: \${failure.name}\`);
      console.log(\`     Error: \${failure.error}\`);
    });
    
    console.log('\\n💡 Hint: Review your implementation and ensure it meets all the requirements.');
    process.exit(1); // Exit with error if any tests failed
  } else {
    console.log('\\n🎉 All tests passed! Great job!');
  }
});
// ===== END ENHANCED TEST FRAMEWORK =====

// Import the test file
require('${testFilePath.replace(/\\/g, '\\\\')}');
`;
        
        await fs.promises.writeFile(tempTestFile, content);
        
        const process = cp.spawn('node', [tempTestFile]);
        
        let output = '';
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
          output += data.toString();
        });
        
        process.on('close', async (code) => {
          this.showOutput(output);
          
          // Clean up the temporary file
          try {
            await fs.promises.unlink(tempTestFile);
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
          
          // Show success message if all tests passed
          if (code === 0) {
            vscode.window.showInformationMessage('🎉 All tests passed! Ready to move to the next module.');
          } else {
            vscode.window.showWarningMessage('Some tests failed. Check the Test Results output for details.');
          }
          
          resolve(code === 0);
        });
      }} catch (error: any) {
        console.error('Error running JavaScript tests:', error);
        this.showOutput(`Error running tests: ${error.message}`);
        resolve(false);
      }
    });
  }
  /**
   * Run JavaScript tests for modules with separate test files
   */
  private async runJavaScriptMultiTests(moduleDir: string, masterTestFile: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        // Set up output channel for test results
        const outputChannel = vscode.window.createOutputChannel('Test Results');
        outputChannel.show();
        outputChannel.appendLine(`Running tests for module at ${moduleDir}...`);
        
        // Check if the master test file exists
        if (!fs.existsSync(masterTestFile)) {
          // Generate a temporary master test file that doesn't require Mocha
          const tempMasterFile = path.join(moduleDir, '_temp_master_test.js');
          const testsDir = path.join(moduleDir, 'tests');
          
          // Create a simpler test runner that uses our test framework
          let content = '';
          
          if (this.mochaAvailable) {
            outputChannel.appendLine('Using Mocha for test execution');
            content = `
// Temporary master test file for running multiple tests with Mocha
const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');

// Create mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Find all test files
const testDir = path.join('${testsDir.replace(/\\/g, '\\\\')}');
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(1);
}

// Add each test file
testFiles.forEach(file => {
  mocha.addFile(path.join(testDir, file));
});

// Run tests
mocha.run(failures => {
  process.exit(failures ? 1 : 0);
});`;
          } else {
            outputChannel.appendLine('Using custom test framework for test execution');
            content = `
// Temporary master test file for running multiple tests
const path = require('path');
const fs = require('fs');

// Try to load the custom test framework
try {
  const { describe, it, assert } = require('${path.join(path.dirname(path.dirname(moduleDir)), 'templates', 'testFramework.js').replace(/\\/g, '\\\\')}');
  global.describe = describe;
  global.it = it;
  global.assert = assert;
} catch (error) {
  console.error('Error loading test framework:', error);
  process.exit(1);
}

// Find all test files
const testDir = path.join('${testsDir.replace(/\\/g, '\\\\')}');
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(1);
}

// Run all test files
let allPassed = true;
testFiles.forEach(file => {
  try {
    console.log(\`\\n📋 Running tests from \${file}...\`);
    require(path.join(testDir, file));
  } catch (error) {
    console.error(\`Error running test file \${file}: \${error.message}\`);
    allPassed = false;
  }
});

// Exit with appropriate code
if (!allPassed) {
  process.exit(1);
}`;
          }
          
          await fs.promises.writeFile(tempMasterFile, content);
          masterTestFile = tempMasterFile;
        }
        
        // Run the tests using Node.js and capture output
        const testProcess = cp.spawn('node', [masterTestFile], {
          cwd: moduleDir,
          shell: true
        });
        
        testProcess.stdout.on('data', (data) => {
          outputChannel.append(data.toString());
        });
        
        testProcess.stderr.on('data', (data) => {
          outputChannel.append(data.toString());
        });
        
        testProcess.on('close', async (code) => {
          // Clean up temp file if we created one
          if (masterTestFile.includes('_temp_master_test.js')) {
            try {
              await fs.promises.unlink(masterTestFile);
            } catch (err) {
              console.error('Error cleaning up temp file:', err);
            }
          }
          
          if (code === 0) {
            outputChannel.appendLine('\n✅ All tests passed successfully!');
            resolve(true);
          } else {
            outputChannel.appendLine(`\n❌ Tests failed with exit code: ${code}`);
            resolve(false);
          }
        });
      } catch (error) {
        console.error(`Error running JavaScript multi-tests: ${error}`);
        vscode.window.showErrorMessage(`Error running tests: ${error}`);
        resolve(false);
      }
    });
  }
  
 
  /**
   * Run tests for split exercise files
   */
  private async runSplitExerciseTests(moduleId: string, exercisesDir: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        // Set up output channel for test results
        const outputChannel = vscode.window.createOutputChannel('Test Results');
        outputChannel.show();
        
        // Colorful header
        outputChannel.appendLine('══════════════════════════════════════════════════════════════════════════════');
        outputChannel.appendLine('                         🧪 RUNNING MODULE TESTS 🧪                            ');
        outputChannel.appendLine('══════════════════════════════════════════════════════════════════════════════');
        outputChannel.appendLine('');
        outputChannel.appendLine(`📌 Module: ${moduleId}`);
        outputChannel.appendLine('');
        
        // Read all JSON exercise files in the directory
        const files = await fs.promises.readdir(exercisesDir);
        const exerciseFiles = files.filter(file => 
          file.startsWith(moduleId) && 
          file.endsWith('.json') && 
          !file.includes('chapter-info')
        );
        
        if (exerciseFiles.length === 0) {
          outputChannel.appendLine('❌ No exercise files found for this module.');
          outputChannel.appendLine('   Please check that you have the correct module ID and try again.');
          resolve(false);
          return;
        }
        
        outputChannel.appendLine(`✅ Found ${exerciseFiles.length} exercise files to test:`);
        exerciseFiles.forEach((file, index) => {
          outputChannel.appendLine(`   ${index + 1}. ${file}`);
        });
        outputChannel.appendLine('');
        
        // Create a temporary directory for test files
        const tempDir = path.join(exercisesDir, '_temp_test_dir');
        if (!fs.existsSync(tempDir)) {
          await fs.promises.mkdir(tempDir);
        }
        
        let allTestsPassed = true;
        let totalTests = 0;
        let passedTests = 0;
        
        // Process each exercise file
        for (const file of exerciseFiles) {
          try {
            const filePath = path.join(exercisesDir, file);
            const exercise = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
            
            // Skip if no JS test is defined
            if (!exercise.jsTest) {
              continue;
            }
            
            outputChannel.appendLine(`\nTesting exercise: ${exercise.name}`);
            
            // Create a test file for this exercise
            const testFilePath = path.join(tempDir, `${exercise.name}.test.js`);
            const mainFilePath = path.join(tempDir, `${exercise.name}.js`);
            
            // If user's solution exists, use it, otherwise use the template
            const userMainFile = path.join(path.dirname(exercisesDir), moduleId, `${exercise.name}.js`);
            let mainContent;
            
            if (fs.existsSync(userMainFile)) {
              mainContent = await fs.promises.readFile(userMainFile, 'utf8');
            } else {
              // Use template as a fallback
              mainContent = exercise.jsTemplate;
              outputChannel.appendLine(`⚠️ No solution file found, using template for ${exercise.name}`);
            }
            
            // Write the main file
            await fs.promises.writeFile(mainFilePath, mainContent);
            
            // Create test file with enhanced framework
            const testContent = `
// Test file for ${exercise.name}
const { describe, it, assert } = require('${path.join(path.dirname(path.dirname(path.dirname(exercisesDir))), 'templates', 'testFramework.js').replace(/\\/g, '\\\\')}');

// Load the solution
const ${exercise.name} = require('${mainFilePath.replace(/\\/g, '\\\\')}');

describe("${exercise.name}", () => {
${exercise.jsTest}
});
`;
            await fs.promises.writeFile(testFilePath, testContent);
            
            // Run the test
            const testProcess = cp.spawn('node', [testFilePath], {
              cwd: tempDir,
              shell: true
            });
            
            let testOutput = '';
            
            testProcess.stdout.on('data', (data) => {
              const output = data.toString();
              testOutput += output;
              outputChannel.append(output);
            });
            
            testProcess.stderr.on('data', (data) => {
              outputChannel.append(data.toString());
            });
            
            // Wait for the test to complete
            const exitCode = await new Promise<number>(resolve => {
              testProcess.on('close', code => resolve(code ?? 1));
            });
            
            // Count the test results
            const testLines = testOutput.split('\n');
            const summaryLine = testLines.find(line => line.includes('Total:'));
            
            if (summaryLine) {
              const match = summaryLine.match(/Total:\s*(\d+)\s*\|\s*✅\s*Passed:\s*(\d+)/);
              if (match) {
                const total = parseInt(match[1]);
                const passed = parseInt(match[2]);
                
                totalTests += total;
                passedTests += passed;
                
                if (passed < total) {
                  allTestsPassed = false;
                }
              }
            } else if (exitCode !== 0) {
              allTestsPassed = false;
            }
            
          } catch (error) {
            console.error(`Error processing exercise file ${file}:`, error);
            outputChannel.appendLine(`Error processing exercise file ${file}: ${error}`);
            allTestsPassed = false;
          }
        }
        
        // Clean up temp directory
        try {
          await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.error('Error removing temp directory:', err);
        }
        
        // Show final results with a visual summary
        outputChannel.appendLine(`\n\n${'═'.repeat(70)}`);
        outputChannel.appendLine(`📊 OVERALL TEST SUMMARY FOR MODULE: ${moduleId}`);
        outputChannel.appendLine(`${'═'.repeat(70)}`);
        
        // Create a visual progress bar
        const totalWidth = 50;
        const passPercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const passWidth = Math.round((passedTests / totalTests) * totalWidth);
        const failWidth = totalWidth - passWidth;
        
        const progressBar = [
          '  Progress: [' + '█'.repeat(passWidth) + ' '.repeat(failWidth) + '] ' + passPercent + '%'
        ].join('\n');
        
        outputChannel.appendLine(progressBar);
        outputChannel.appendLine(`  Total Tests: ${totalTests}`);
        outputChannel.appendLine(`  ✅ Passed: ${passedTests}`);
        outputChannel.appendLine(`  ❌ Failed: ${totalTests - passedTests}`);
        outputChannel.appendLine(`${'─'.repeat(70)}`);
        
        if (allTestsPassed) {
          outputChannel.appendLine('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
          outputChannel.appendLine('\n💡 NEXT STEPS:');
          outputChannel.appendLine('  • Move on to the next module');
          outputChannel.appendLine('  • Try optimizing your solution');
          outputChannel.appendLine('  • Review what you\'ve learned');
          
          vscode.window.showInformationMessage('🎉 All tests passed! Ready to move to the next module.', 'Next Module')
            .then(selection => {
              if (selection === 'Next Module') {
                vscode.commands.executeCommand('interactive-course.goToNextModule');
              }
            });
          resolve(true);
        } else {
          outputChannel.appendLine('\n❌ SOME TESTS FAILED');
          outputChannel.appendLine('\n💡 HOW TO FIX:');
          outputChannel.appendLine('  • Review the error details above');
          outputChannel.appendLine('  • Check your code against the requirements');
          outputChannel.appendLine('  • Fix one error at a time');
          outputChannel.appendLine('  • Run the tests again after each fix');
          
          vscode.window.showWarningMessage('Some tests failed. Check the Test Results output for details.', 'View Details')
            .then(selection => {
              if (selection === 'View Details') {
                outputChannel.show(true);
              }
            });
          resolve(false);
        }
        
      } catch (error) {
        console.error(`Error running split exercise tests: ${error}`);
        vscode.window.showErrorMessage(`Error running tests: ${error}`);
        resolve(false);
      }
    });
  }
  
  /**
   * Helper method to show test output in an output channel with enhanced visual style
   */
  private showOutput(output: string) {
    const channel = vscode.window.createOutputChannel('Test Results');
    channel.clear();
    
    // Add a visually appealing header with emojis
    const header = [
      '╔══════════════════════════════════════════════════════════════════════════════╗',
      '║                           🧪 TEST RESULTS 🧪                                  ║',
      '╚══════════════════════════════════════════════════════════════════════════════╝',
      '',
      '📘 GUIDE TO TEST RESULTS:',
      '  ✅ = Test passed successfully       ❌ = Test failed (needs your attention)',
      '  📋 = Group of related tests         📊 = Summary of test results',
      '  💡 = Helpful hint to fix an issue   🏁 = Final result indicator',
      '',
      '══════════════════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    // Format the output with visual enhancements
    const formattedOutput = output.split('\n').map((line, index) => {
      // Add some extra formatting to make important info stand out
      if (line.includes('FAILED TESTS')) {
        return `\n🔍 ${line}\n${'─'.repeat(70)}`;
      } else if (line.includes('BEGINNER\'S GUIDE') || line.includes('NEXT STEPS')) {
        return `\n📚 ${line}\n${'─'.repeat(70)}`;
      } else if (line.includes('TEST RESULTS SUMMARY') || line.includes('TEST SUMMARY')) {
        return `\n📊 ${line}\n${'─'.repeat(70)}`;
      } else if (line.includes('✅') && line.includes('[T')) {
        // Make passing tests more visually distinctive
        return `${line}`;
      } else if (line.includes('❌') && line.includes('[T')) {
        // Make failing tests more visually distinctive
        return `${line}`;
      } else if (line.includes('Error:')) {
        // Indent and format error messages for readability
        return `    ${line}`;
      } else if (line.includes('💡 Hint:')) {
        // Make hints stand out
        return `    ${line}`;
      } else {
        return line;
      }
    }).join('\n');
    
    channel.appendLine(header + formattedOutput);
    
    // Add beginner-friendly footer with detailed explanation
    const footer = [
      '',
      '══════════════════════════════════════════════════════════════════════════════',
      '📘 UNDERSTANDING YOUR TEST RESULTS:',
      '  • Each test checks if your code does what it should do',
      '  • Green checkmarks (✅) show that part of your code works correctly',
      '  • Red X marks (❌) show that part of your code needs fixing',
      '',
      '💡 IF YOUR TESTS FAILED:',
      '  1. Read the error messages carefully - they tell you what went wrong',
      '  2. Look for the hints (💡) which explain how to fix common problems',
      '  3. Fix one error at a time and run the tests again',
      '  4. Remember: debugging is a normal part of coding!',
      '',
      '🎮 NEED HELP? Check out the exercise description or ask your instructor!',
      '══════════════════════════════════════════════════════════════════════════════',
    ].join('\n');
    
    channel.appendLine(footer);
    channel.show(true); // Show in the foreground
  }
}