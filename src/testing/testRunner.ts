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
        // Create a temporary file that imports the test framework and the test file
        const frameworkPath = path.join(__dirname, '..', 'templates', 'testFramework.js');
        const tempTestFile = path.join(path.dirname(testFilePath), '_temp_test_runner.js');
        
        const content = `
// Temporary test runner file
require('${frameworkPath.replace(/\\/g, '\\\\')}');
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
    return new Promise<boolean>((resolve) => {
      const process = cp.spawn('python', ['-m', 'unittest', testFilePath]);
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        this.showOutput(output);
        resolve(code === 0);
      });
    });
  }
  
  private showOutput(output: string) {
    const channel = vscode.window.createOutputChannel('Test Results');
    channel.clear();
    channel.appendLine(output);
    channel.show();
  }
}