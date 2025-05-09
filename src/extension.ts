import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createCourse } from './commands/createCourse';
import { runTests } from './commands/runTests';
import { ModuleTreeProvider } from './views/moduleTreeProvider';
import { CodeHighlighter } from './utils/codeHighlighter';
import { createNewExerciseModule } from './commands/createExercise';
import { createExerciseSolutionFile } from './commands/createSolutionFile';
import { CourseUtils } from './utils/courseUtils';

export function activate(context: vscode.ExtensionContext) {
  console.log('🎓 Interactive Course Extension is now active!');

  // Create code highlighter
  const codeHighlighter = new CodeHighlighter();
  context.subscriptions.push(codeHighlighter);

  // Check if we're in development mode (not packaged yet)
  const isDevMode = checkIfInDevelopmentMode(context);

  // Register common commands
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.createCourse', () => createCourse()),
    vscode.commands.registerCommand('extension.runTests', async () => {
      const moduleId = await CourseUtils.getCurrentModuleId();
      if (moduleId) {
        runTests(moduleId);
      } else {
        vscode.window.showInformationMessage(
          'No module detected for test execution. Please open a file from the module you want to test.',
          'Create Course'
        ).then(selection => {
          if (selection === 'Create Course') {
            vscode.commands.executeCommand('extension.createCourse');
          }
        });
      }
    }),
    vscode.commands.registerCommand('extension.createSolutionFile', () => createExerciseSolutionFile())
  );
  
  // Register development-only commands
  if (isDevMode) {
    console.log('Running in development mode - enabling exercise creation features');
    context.subscriptions.push(
      vscode.commands.registerCommand('extension.createNewExercise', () => createNewExerciseModule())
    );
    
    // Set context key for conditionally showing UI elements
    vscode.commands.executeCommand('setContext', 'interactiveCourse.devMode', true);
  } else {
    // Ensure dev-only UI elements are hidden
    vscode.commands.executeCommand('setContext', 'interactiveCourse.devMode', false);
  }
  
  // Register tree view
  const moduleTreeProvider = new ModuleTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('courseModules', moduleTreeProvider),
    moduleTreeProvider // Add the tree provider itself to be disposed
  );
  
  // Register refresh command for tree view
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.refreshModules', () => moduleTreeProvider.refresh())
  );
  
  // Register run module tests command
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.runModuleTests', async (moduleId) => {
      try {
        // If moduleId is not provided directly, try to determine it
        if (!moduleId) {
          moduleId = await CourseUtils.getCurrentModuleId();
          console.log(`[DEBUG] Determined moduleId from context: ${moduleId}`);
        }
        
        if (moduleId) {
          // Check if test files exist for this module
          const testFiles = await CourseUtils.findModuleTestFiles(moduleId);
          
          if (testFiles.length > 0) {
            console.log(`[DEBUG] Found ${testFiles.length} test files for module ${moduleId}`);
            runTests(moduleId);
          } else {
            vscode.window.showWarningMessage(`No test files found for module '${moduleId}'.`);
          }
        } else {
          // If still no moduleId, show a more helpful error message
          vscode.window.showInformationMessage(
            'No module detected for test execution. Please open a file from the module you want to test.',
            'Create Course'
          ).then(selection => {
            if (selection === 'Create Course') {
              vscode.commands.executeCommand('extension.createCourse');
            }
          });
        }
      } catch (error) {
        console.error('Error running module tests:', error);
        vscode.window.showErrorMessage(`Error running module tests: ${error}`);
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
        
        // Open directly in preview mode instead of opening the document first
        await vscode.commands.executeCommand('markdown.showPreviewToSide', exUri);
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
        
        // Check if the path contains a module pattern like "01-variables-dataTypes" anywhere
        if (filePath.match(/0\d-\w+/) || 
            // Match any JavaScript file in the workspace
            (filePath.endsWith('.js') && !filePath.includes('node_modules'))) {
          console.log(`[DEBUG] Showing test button for file: ${filePath}`);
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
    
    // Check if the path contains a module pattern like "01-variables-dataTypes" anywhere
    if (filePath.match(/0\d-\w+/) || 
        // Match any JavaScript file in the workspace
        (filePath.endsWith('.js') && !filePath.includes('node_modules'))) {
      console.log(`[DEBUG] Initially showing test button for file: ${filePath}`);
      testStatusBarItem.show();
      codeHighlighter.updateDecorations(vscode.window.activeTextEditor);
    }
  }
}

/**
 * Check if the extension is running in development mode
 * This helps us conditionally enable features that should only be available to the extension developer
 */
function checkIfInDevelopmentMode(context: vscode.ExtensionContext): boolean {
  const extensionPath = context.extensionPath;
  
  // Check for the presence of package.json in the extension path
  const packageJsonPath = path.join(extensionPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      // In development mode, the node_modules folder exists alongside package.json
      const nodeModulesPath = path.join(extensionPath, 'node_modules');
      return fs.existsSync(nodeModulesPath);
    } catch (error) {
      console.error('Error checking development mode:', error);
    }
  }
  
  return false;
}

export function deactivate() {}