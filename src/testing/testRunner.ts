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
          } else if (testFile.endsWith('.py') && this.language === 'python') {
            const dir = path.dirname(testFile);
            const exercisesDir = path.join(dir, 'exercises');
            const testsDir = path.join(dir, 'tests');
            
            if (fs.existsSync(exercisesDir) && fs.existsSync(testsDir)) {
              return await this.runPythonMultiTests(dir, testFile);
            } else {
              return await this.runPythonTests(testFile);
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
            } else if (this.language === 'python') {
              return await this.runPythonMultiTests(dir, testFilePath);
            }
          } else {
            // Fall back to the original single-file structure
            console.log(`[DEBUG] Using single-file structure for module ${moduleId}`);
            if (this.language === 'javascript') {
              return await this.runJavaScriptTests(testFilePath);
            } else if (this.language === 'python') {
              return await this.runPythonTests(testFilePath);
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
        } else if (this.language === 'python') {
          return await this.runPythonMultiTests(moduleId, exercisesDir);
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
  
  private async runPythonTests(testFilePath: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        // Create a temporary wrapper to enhance test output
        const moduleDir = path.dirname(testFilePath);
        const tempTestFile = path.join(moduleDir, '_temp_python_test_runner.py');
        
        // Enhanced Python test wrapper
        const content = `
# Temporary Python test runner with enhanced reporting
import unittest
import sys
import os
import importlib.util
from unittest.runner import TextTestResult
from unittest.result import TestResult

class EnhancedTestResult(TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.function_results = {}
        
    def startTest(self, test):
        super().startTest(test)
        test_name = test._testMethodName
        function_name = test_name.replace('test_', '')
        
        # Initialize function tracking
        if function_name not in self.function_results:
            self.function_results[function_name] = {
                'total': 0,
                'passed': 0,
                'failed': 0,
                'errors': []
            }
        
        self.function_results[function_name]['total'] += 1
        
    def addSuccess(self, test):
        super().addSuccess(test)
        test_name = test._testMethodName
        function_name = test_name.replace('test_', '')
        self.function_results[function_name]['passed'] += 1
        
    def addFailure(self, test, err):
        super().addFailure(test, err)
        test_name = test._testMethodName
        function_name = test_name.replace('test_', '')
        self.function_results[function_name]['failed'] += 1
        self.function_results[function_name]['errors'].append({
            'name': test_name,
            'error': str(err[1])
        })
        
    def addError(self, test, err):
        super().addError(test, err)
        test_name = test._testMethodName
        function_name = test_name.replace('test_', '')
        self.function_results[function_name]['failed'] += 1
        self.function_results[function_name]['errors'].append({
            'name': test_name,
            'error': str(err[1])
        })

# Import the test module
test_path = "${testFilePath.replace(/\\/g, '\\\\')}"
module_name = os.path.basename(test_path).replace('.py', '')
spec = importlib.util.spec_from_file_location(module_name, test_path)
test_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(test_module)

# Find test classes in the module
test_suite = unittest.defaultTestLoader.loadTestsFromModule(test_module)

# Run tests with enhanced reporting
runner = unittest.TextTestRunner(resultclass=EnhancedTestResult, verbosity=2)
result = runner.run(test_suite)

# Print enhanced summary
print("\\n📊 Test Summary:")
print(f"   Total: {result.testsRun} | ✅ Passed: {result.testsRun - len(result.failures) - len(result.errors)} | ❌ Failed: {len(result.failures) + len(result.errors)}")

print("\\n📝 Function Details:")
for func, data in result.function_results.items():
    status = '❌' if data['failed'] > 0 else '✅';
    print(f"   {status} {func}: {data['passed']}/{data['total']} tests passed")

if result.failures or result.errors:
    print("\\n🔍 Failed Tests:")
    for func, data in result.function_results.items():
        if data['errors']:
            for error in data['errors']:
                print(f"   • {func}: {error['name']}")
                print(f"     Error: {error['error']}")
    
    print("\\n💡 Hint: Review your implementation and ensure it meets all the requirements.")
    sys.exit(1)
else:
    print("\\n🎉 All tests passed! Great job!")
    sys.exit(0)
`;
        
        await fs.promises.writeFile(tempTestFile, content);
        
        const process = cp.spawn('python', [tempTestFile]);
        
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
      } catch (error: any) {
        console.error('Error running Python tests:', error);
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
   * Run Python tests for modules with separate test files
   */
  private async runPythonMultiTests(moduleDir: string, masterTestFile: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        // Use the master test file that discovers and runs all individual test files
        console.log(`[DEBUG] Running Python tests from master file: ${masterTestFile}`);
        
        // Set up output channel for test results
        const outputChannel = vscode.window.createOutputChannel('Test Results');
        outputChannel.show();
        outputChannel.appendLine(`Running tests for module at ${moduleDir}...`);
        
        // Run the tests using Python and capture output
        const testProcess = cp.spawn('python', [masterTestFile], {
          cwd: moduleDir,
          shell: true
        });
        
        testProcess.stdout.on('data', (data) => {
          outputChannel.append(data.toString());
        });
        
        testProcess.stderr.on('data', (data) => {
          outputChannel.append(data.toString());
        });
        
        testProcess.on('close', (code) => {
          if (code === 0) {
            outputChannel.appendLine('\n✅ All tests passed successfully!');
            vscode.window.showInformationMessage('🎉 All tests passed! Ready to move to the next module.');
            resolve(true);
          } else {
            outputChannel.appendLine(`\n❌ Tests failed with exit code: ${code}`);
            vscode.window.showWarningMessage('Some tests failed. Check the Test Results output for details.');
            resolve(false);
          }
        });
      } catch (error) {
        console.error(`Error running Python multi-tests: ${error}`);
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
        outputChannel.appendLine(`Running tests for module ${moduleId}...`);
        
        // Read all JSON exercise files in the directory
        const files = await fs.promises.readdir(exercisesDir);
        const exerciseFiles = files.filter(file => 
          file.startsWith(moduleId) && 
          file.endsWith('.json') && 
          !file.includes('chapter-info')
        );
        
        if (exerciseFiles.length === 0) {
          outputChannel.appendLine('No exercise files found.');
          resolve(false);
          return;
        }
        
        outputChannel.appendLine(`Found ${exerciseFiles.length} exercise files to test.`);
        
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
        
        // Show final results
        outputChannel.appendLine(`\n\n📊 Overall Test Summary:`);
        outputChannel.appendLine(`   Total Tests: ${totalTests} | ✅ Passed: ${passedTests} | ❌ Failed: ${totalTests - passedTests}`);
        
        if (allTestsPassed) {
          outputChannel.appendLine('\n✅ All tests passed successfully!');
          vscode.window.showInformationMessage('🎉 All tests passed! Ready to move to the next module.');
          resolve(true);
        } else {
          outputChannel.appendLine('\n❌ Some tests failed. Review the output above for details.');
          vscode.window.showWarningMessage('Some tests failed. Check the Test Results output for details.');
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
   * Helper method to show test output in an output channel
   */
  private showOutput(output: string) {
    const channel = vscode.window.createOutputChannel('Test Results');
    channel.clear();
    channel.appendLine(output);
    channel.show();
  }
}