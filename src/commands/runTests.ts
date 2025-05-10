import * as vscode from 'vscode';
import { ProgressManager } from '../progression/progressManager';
import { TestRunner } from '../testing/testRunner';
import * as path from 'path';

export async function runTests(specificModuleId?: string) {
  const progressManager = new ProgressManager();
  const manifest = await progressManager.loadManifest();
  
  if (!manifest) {
    vscode.window.showErrorMessage('No course found in this workspace.');
    return;
  }
  
  // Use specified module if provided, otherwise use current module from manifest
  const currentModuleId = specificModuleId || manifest.currentModule;
  const currentModule = manifest.modules.find(m => m.id === currentModuleId);
  
  if (!currentModule) {
    vscode.window.showErrorMessage('Module not found.');
    return;
  }
  
  // Ensure first module is always testable
  const isFirstModule = manifest.modules.indexOf(currentModule) === 0;
  
  // Allow running tests regardless of module status if it's the first module
  if (currentModule.status === 'locked' && !isFirstModule) {
    vscode.window.showWarningMessage('This module is locked. Complete previous modules first.');
    return;
  }
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Running tests for module: ${currentModule.title}`,
    cancellable: false
  }, async (progress) => {
    progress.report({ 
      increment: 0,
      message: "Starting test runner..."
    });

    // Show an initial status message for beginners
    const channel = vscode.window.createOutputChannel('Test Status');
    channel.clear();
    channel.appendLine('🔍 Examining your code and running tests...');
    channel.appendLine('⏳ Please wait while we check your solution...');
    channel.show();
    
    // Set up a progress animation with steps to make the process more engaging
    const progressSteps = [
      { increment: 10, message: "Analyzing your code..." },
      { increment: 30, message: "Running tests..." },
      { increment: 50, message: "Checking results..." },
      { increment: 80, message: "Finalizing..." }
    ];
    
    // Report progress at timed intervals for a more visual effect
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Add a small delay
      progress.report(step);
    }
    
    try {
      const testRunner = new TestRunner(manifest.language);
      // Ensure we're passing the module ID as a string, not the module object
      const success = await testRunner.runTests(currentModule.id);
      progress.report({ increment: 100, message: "Complete!" });
      
      // Close the status channel as we're done
      channel.dispose();
      
      if (success) {
        // Only update progress if testing the current active module
        if (currentModuleId === manifest.currentModule) {
          await progressManager.completeCurrentModule(manifest);
          vscode.window.showInformationMessage(
            `Congratulations! You have completed the "${currentModule.title}" module.`,
            'View Next Module'
          ).then(selection => {
            if (selection === 'View Next Module') {
              openNextModule(manifest);
            }
          });
        } else {
          vscode.window.showInformationMessage(`Tests for "${currentModule.title}" passed successfully!`);
        }
      } else {
        vscode.window.showWarningMessage(
          'Some tests failed. Keep working on your solution.'
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error running tests: ${error}`);
    }
  });
}

async function openNextModule(manifest: any) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) { return; }
  
  // Find the course directory (it contains the course.json file)
  let courseDir: vscode.Uri | undefined;
  
  try {
    const files = await vscode.workspace.findFiles('**/course.json');
    if (files.length > 0) {
      courseDir = vscode.Uri.file(path.dirname(files[0].fsPath));
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error finding course directory: ${error}`);
    return;
  }
  
  if (!courseDir) {
    vscode.window.showErrorMessage('Course directory not found.');
    return;
  }
  
  const moduleDir = vscode.Uri.joinPath(courseDir, manifest.currentModule);
  const exUri = vscode.Uri.joinPath(moduleDir, 'lesson.md');
  
  try {
    // Open directly in preview mode
    await vscode.commands.executeCommand('markdown.showPreviewToSide', exUri);
  } catch (error) {
    vscode.window.showErrorMessage(`Unable to open next module: ${error}`);
  }
}