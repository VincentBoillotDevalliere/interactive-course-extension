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
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Running tests for ${currentModule.title}`,
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0 });
    
    try {
      const testRunner = new TestRunner(manifest.language);
      const success = await testRunner.runTests(currentModuleId);
      progress.report({ increment: 100 });
      
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
  const exUri = vscode.Uri.joinPath(moduleDir, 'exercise.md');
  
  try {
    const doc = await vscode.workspace.openTextDocument(exUri);
    await vscode.window.showTextDocument(doc);
    
    // Also automatically show Markdown preview alongside the editor
    await vscode.commands.executeCommand('markdown.showPreview', exUri);
  } catch (error) {
    vscode.window.showErrorMessage(`Unable to open next module: ${error}`);
  }
}