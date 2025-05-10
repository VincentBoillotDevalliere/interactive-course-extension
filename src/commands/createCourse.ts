import * as vscode from 'vscode';
import { discoverAvailableModules } from '../utils/moduleDiscovery';
import { createModuleFiles } from '../utils/moduleFileGenerator';

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

  // 4. Create (and open) only the first module
  if (modules.length > 0) {
    try {
      await createModuleFiles(courseFolderUri, modules[0], language, true);

      // First open the getting-started guide
      const readmeUri = vscode.Uri.joinPath(courseFolderUri, 'README.md');
      try {
        const readmeDoc = await vscode.workspace.openTextDocument(readmeUri);
        const readmeEditor = await vscode.window.showTextDocument(readmeDoc);
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

  // 5. Refresh tree view
  vscode.commands.executeCommand('extension.refreshModules');
}
