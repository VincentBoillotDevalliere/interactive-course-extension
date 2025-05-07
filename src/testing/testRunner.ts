import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

export class TestRunner {
  constructor(private language: string) {}
  
  public async runTests(moduleId: string): Promise<boolean> {
    try {
      // Find course directory (containing course.json)
      const files = await vscode.workspace.findFiles('**/course.json');
      if (files.length === 0) {
        vscode.window.showErrorMessage('Course file (course.json) not found.');
        return false;
      }
      
      const courseDir = path.dirname(files[0].fsPath);
      const moduleDir = path.join(courseDir, moduleId);
      const testFileExt = this.language === 'javascript' ? 'js' : 'py';
      const testFilePath = path.join(moduleDir, `tests.${testFileExt}`);
      
      if (this.language === 'javascript') {
        return await this.runJavaScriptTests(testFilePath);
      } else if (this.language === 'python') {
        return await this.runPythonTests(testFilePath);
      }
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
        
        // Enhanced test framework that tracks function-level progress
        const content = `
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
      } catch (error: any) {
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
    status = '❌' if data['failed'] > 0 else '✅'
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
  
  private showOutput(output: string) {
    const channel = vscode.window.createOutputChannel('Test Results');
    channel.clear();
    channel.appendLine(output);
    channel.show();
  }
}