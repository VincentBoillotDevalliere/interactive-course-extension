import * as vscode from 'vscode';
import * as path from 'path';
import { createCourse } from './commands/createCourse';
import { runTests } from './commands/runTests';
import { ModuleTreeProvider } from './views/moduleTreeProvider';
import { CodeHighlighter } from './utils/codeHighlighter';

export function activate(context: vscode.ExtensionContext) {
  console.log('🎓 Interactive Course Extension is now active!');

  // Create code highlighter
  const codeHighlighter = new CodeHighlighter();
  context.subscriptions.push(codeHighlighter);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.createCourse', () => createCourse()),
    vscode.commands.registerCommand('extension.runTests', () => runTests())
  );
  
  // Register tree view
  const moduleTreeProvider = new ModuleTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('courseModules', moduleTreeProvider)
  );
  
  // Register refresh command for tree view
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.refreshModules', () => moduleTreeProvider.refresh())
  );
  
  // Register run module tests command
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.runModuleTests', (moduleId) => {
      if (!moduleId && vscode.window.activeTextEditor) {
        // If no moduleId provided but we have an active editor, try to extract moduleId from file path
        const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
        const match = filePath.match(/[\\/](0\d-\w+)[\\/]/);
        if (match && match[1]) {
          moduleId = match[1];
        }
      }
      
      if (moduleId) {
        runTests(moduleId);
      } else {
        vscode.window.showErrorMessage('No module specified for test execution.');
      }
    })
  );
  
  // Register open module command
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openModule', async (moduleId) => {
      try {
        // Find course directory (containing course.json)
        const files = await vscode.workspace.findFiles('**/course.json');
        if (files.length === 0) {
          vscode.window.showErrorMessage('Course file (course.json) not found.');
          return;
        }
        
        const courseDir = path.dirname(files[0].fsPath);
        const exUri = vscode.Uri.file(path.join(courseDir, moduleId, 'exercise.md'));
        
        const doc = await vscode.workspace.openTextDocument(exUri);
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Unable to open module: ${error}`);
      }
    })
  );
  
  // Add status bar item for quick test access
  const testStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  testStatusBarItem.text = "$(beaker) Run Tests";
  testStatusBarItem.tooltip = "Run tests for current module";
  testStatusBarItem.command = 'extension.runModuleTests';
  context.subscriptions.push(testStatusBarItem);
  
  // Show status bar item when appropriate
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        const filePath = editor.document.uri.fsPath;
        if (filePath.match(/[\\/](0\d-\w+)[\\/](main\.(js|py))$/)) {
          testStatusBarItem.show();
          
          // Update code decorations
          codeHighlighter.updateDecorations(editor);
        } else {
          testStatusBarItem.hide();
        }
      } else {
        testStatusBarItem.hide();
      }
    })
  );

  // Update decorations when text changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
        codeHighlighter.updateDecorations(vscode.window.activeTextEditor);
      }
    })
  );
  
  // Initialize status bar visibility and decorations
  if (vscode.window.activeTextEditor) {
    const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    if (filePath.match(/[\\/](0\d-\w+)[\\/](main\.(js|py))$/)) {
      testStatusBarItem.show();
      codeHighlighter.updateDecorations(vscode.window.activeTextEditor);
    }
  }
}

export function deactivate() {}