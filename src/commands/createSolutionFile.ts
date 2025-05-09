import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create a JavaScript solution file for an exercise
 */
export async function createExerciseSolutionFile() {
  try {
    // Get active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }
    
    // Check if we're in an exercise JSON file
    const filePath = editor.document.uri.fsPath;
    if (!filePath.endsWith('.json')) {
      vscode.window.showErrorMessage('This command should be run from an exercise JSON file.');
      return;
    }
    
    // Extract moduleId from the path
    const moduleMatch = filePath.match(/[\\/]exercises[\\/](0\d-\w+)[\\/]/);
    if (!moduleMatch) {
      vscode.window.showErrorMessage('Could not determine module ID from the file path.');
      return;
    }
    
    const moduleId = moduleMatch[1];
    
    // Load the exercise JSON
    const exerciseContent = editor.document.getText();
    let exercise;
    
    try {
      exercise = JSON.parse(exerciseContent);
    } catch (err) {
      vscode.window.showErrorMessage(`Invalid JSON: ${err}`);
      return;
    }
    
    if (!exercise.name || !exercise.jsTemplate) {
      vscode.window.showErrorMessage('Exercise JSON must contain name and jsTemplate properties.');
      return;
    }
    
    // Find a location to save the solution file
    // First, look for a module directory at the workspace level
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    
    // Try to find or create the module directory
    const moduleDir = path.join(workspaceFolders[0].uri.fsPath, moduleId);
    
    if (!fs.existsSync(moduleDir)) {
      await fs.promises.mkdir(moduleDir, { recursive: true });
    }
    
    // Create the JavaScript file with the template
    const jsFilePath = path.join(moduleDir, `${exercise.name}.js`);
    
    if (fs.existsSync(jsFilePath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `File ${exercise.name}.js already exists. Overwrite?`,
        'Yes', 'No'
      );
      
      if (overwrite !== 'Yes') {
        vscode.window.showInformationMessage('Operation cancelled.');
        return;
      }
    }
    
    // Write the file
    await fs.promises.writeFile(jsFilePath, exercise.jsTemplate);
    
    // Open the file
    const document = await vscode.workspace.openTextDocument(jsFilePath);
    await vscode.window.showTextDocument(document);
    
    vscode.window.showInformationMessage(`Created solution file for ${exercise.name}.`);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating solution file: ${error}`);
  }
}
