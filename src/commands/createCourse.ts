import * as vscode from 'vscode';
import { discoverAvailableModules } from '../utils/moduleDiscovery';
import { createModuleFiles } from '../utils/moduleFileGenerator';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Installs Mocha in the course folder for running JavaScript tests
 * @param courseFolderPath The absolute path to the course folder
 */
async function installMocha(courseFolderPath: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    // Check if package.json exists
    const packageJsonPath = path.join(courseFolderPath, 'package.json');
    let packageJsonExists = false;
    
    try {
      const stats = await fs.promises.stat(packageJsonPath);
      packageJsonExists = stats.isFile();
    } catch (err) {
      // File doesn't exist, we'll create it
    }
    
    // Check if Mocha is already installed
    if (packageJsonExists) {
      try {
        const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        if (
          (packageJson.dependencies && packageJson.dependencies.mocha) ||
          (packageJson.devDependencies && packageJson.devDependencies.mocha)
        ) {
          // Mocha is already installed
          resolve();
          return;
        }
      } catch (err) {
        // Continue with installation if there was an error reading package.json
      }
    }
    
    // If package.json doesn't exist, create it
    if (!packageJsonExists) {
      const process = cp.spawn('npm', ['init', '-y'], { cwd: courseFolderPath });
      
      process.on('close', (initCode) => {
        if (initCode !== 0) {
          reject(new Error(`npm init failed with code ${initCode}`));
          return;
        }
        
        // Continue with Mocha installation
        installMochaPackage();
      });
      
      process.on('error', (err) => {
        reject(new Error(`Error initializing npm: ${err.message}`));
      });
    } else {
      // Package.json exists but Mocha isn't installed, proceed with installation
      installMochaPackage();
    }
    
    function installMochaPackage() {
      const installProcess = cp.spawn('npm', ['install', '--save-dev', 'mocha'], { cwd: courseFolderPath });
      
      installProcess.on('close', (installCode) => {
        if (installCode !== 0) {
          reject(new Error(`npm install mocha failed with code ${installCode}`));
          return;
        }
        
        vscode.window.showInformationMessage('Mocha installed successfully for testing.');
        resolve();
      });
      
      installProcess.on('error', (err) => {
        reject(new Error(`Error installing Mocha: ${err.message}`));
      });
    }
  });
}

export async function createCourse() {
  // 1. Pick language
  const language = await vscode.window.showQuickPick(['javascript'], {
    placeHolder: 'Choose a language'
  });
  if (!language) { return; }

  // 2. Prepare target folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Please open a folder in VS Code first.');
    return;
  }
  const rootUri = workspaceFolders[0].uri;
  const courseFolderUri = vscode.Uri.joinPath(rootUri, `programming-course-${language}`);

  try {
    await vscode.workspace.fs.createDirectory(courseFolderUri);
  } catch (err) {
    vscode.window.showErrorMessage(`Error creating course folder: ${err}`);
    return;
  }

  // 3. Discover modules & write manifest
  const modules = await discoverAvailableModules();
  
  // Make sure the first module is active
  if (modules.length > 0) {
    modules[0].status = 'active';
  }
  
  const manifest = {
    name: `Programming Course - ${language[0].toUpperCase() + language.slice(1)}`,
    language,
    modules,
    currentModule: modules[0]?.id || '',
    version: '1.1.0'
  };
  const manifestUri = vscode.Uri.joinPath(courseFolderUri, 'course.json');

  try {
    await vscode.workspace.fs.writeFile(
      manifestUri,
      Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Error writing manifest: ${err}`);
    return;
  }

  // 4. Install Mocha for test running
  try {
    await installMocha(courseFolderUri.fsPath);
  } catch (err) {
    vscode.window.showWarningMessage(`Warning: Could not install Mocha: ${err}. Tests may not run correctly.`);
    // Continue even if Mocha installation fails
  }

  // 5. Create (and open) only the first module
  if (modules.length > 0) {
    try {
      await createModuleFiles(courseFolderUri, modules[0], language, true);

      // First open the getting-started guide
      const readmeUri = vscode.Uri.joinPath(courseFolderUri, 'README.md');
      try {
        const readmeDoc = await vscode.workspace.openTextDocument(readmeUri);
        await vscode.window.showTextDocument(readmeDoc);
        // Open it in preview mode
        await vscode.commands.executeCommand('markdown.showPreviewToSide', readmeUri);
      } catch (readmeErr) {
        console.error('Error opening README:', readmeErr);
        // Continue even if README can't be opened
      }

      vscode.window.showInformationMessage(
        `Course "${manifest.name}" created! Check out the getting-started guide first.`
      );
    } catch (err) {
      vscode.window.showErrorMessage(`Error creating/opening module: ${err}`);
      return;
    }
  } else {
    vscode.window.showWarningMessage(
      'No exercise modules found. Please add files under assets/exercises.'
    );
  }

  // 6. Refresh tree view
  vscode.commands.executeCommand('extension.refreshModules');
}
