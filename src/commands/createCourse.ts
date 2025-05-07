import * as vscode from 'vscode';

export async function createCourse() {
  // 1. Language selection
  const language = await vscode.window.showQuickPick(
    ['javascript', 'python'],
    { placeHolder: 'Choose a language' }
  );
  if (!language) { return; }

  // 2. Target folder (first workspace)
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Please open a folder in VS Code first.');
    return;
  }
  const rootUri = workspaceFolders[0].uri;
  
  // Create course folder
  const courseFolderName = `programming-course-${language}`;
  const courseFolderUri = vscode.Uri.joinPath(rootUri, courseFolderName);
  
  try {
    await vscode.workspace.fs.createDirectory(courseFolderUri);
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating course folder: ${error}`);
    return;
  }

  // 3. Build manifest with multiple modules (but only first will be created initially)
  const modules = [
    { id: '01-intro', title: 'Introduction', status: 'active' },
    { id: '02-variables', title: 'Variables', status: 'locked' },
    { id: '03-conditionals', title: 'Conditionals', status: 'locked' },
    { id: '04-loops', title: 'Loops', status: 'locked' },
    { id: '05-functions', title: 'Functions', status: 'locked' }
  ];
  
  const manifest = {
    name: `Programming Course - ${language.charAt(0).toUpperCase() + language.slice(1)}`,
    language: language,
    modules: modules,
    currentModule: '01-intro'
  };
  const manifestUri = vscode.Uri.joinPath(courseFolderUri, 'course.json');

  // 4. Write manifest file directly to disk
  try {
    const manifestContent = JSON.stringify(manifest, null, 2);
    await vscode.workspace.fs.writeFile(manifestUri, Buffer.from(manifestContent, 'utf8'));
  } catch (error) {
    vscode.window.showErrorMessage(`Error writing manifest file: ${error}`);
    return;
  }

  // 5. Create only the first module initially
  try {
    // Only create the first module (index 0)
    await createModuleFiles(courseFolderUri, modules[0], language, true);
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating module files: ${error}`);
    return;
  }
  
  // 6. Open first module
  const exUri = vscode.Uri.joinPath(courseFolderUri, '01-intro', 'exercise.md');
  
  try {
    const doc = await vscode.workspace.openTextDocument(exUri);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showErrorMessage(`Error opening module file: ${error}`);
  }

  vscode.window.showInformationMessage(`Course "${manifest.name}" created! Complete the first module to unlock the next one.`);
  
  // 7. Refresh modules tree view
  vscode.commands.executeCommand('extension.refreshModules');
}

async function createModuleFiles(
  rootUri: vscode.Uri, 
  module: any, 
  language: string,
  isActive: boolean
) {
  // Create module directory
  const moduleDir = vscode.Uri.joinPath(rootUri, module.id);
  await vscode.workspace.fs.createDirectory(moduleDir);
  
  const readmeUri = vscode.Uri.joinPath(moduleDir, 'exercise.md');
  const ext = language === 'javascript' ? 'js' : 'py';
  const mainUri = vscode.Uri.joinPath(moduleDir, `main.${ext}`);
  const testUri = vscode.Uri.joinPath(moduleDir, `tests.${ext}`);
  
  // README content
  const readmeContent = 
    `# Module ${module.id}: ${module.title}\n\n` +
    `## Objectives\n\n` +
    `In this module, you will learn about ${module.title.toLowerCase()}.\n\n` +
    `## Instructions\n\n` +
    `1. Open the \`main.${ext}\` file\n` +
    `2. Implement the requested functions\n` +
    `3. Run the tests to validate your solution\n\n` +
    `## Resources\n\n` +
    `- [Documentation](https://example.com)\n`;
  
  // Main file content
  const mainContent = language === 'javascript' 
    ? `// main.js file for module ${module.id}\n\n` +
      `/**\n * Function to implement\n * @returns {boolean} - true\n */\n` +
      `function testFunction() {\n  // Write your code here\n  return false; // Change this\n}\n\n` +
      `module.exports = {\n  testFunction\n};`
    : `# main.py file for module ${module.id}\n\n` +
      `def test_function():\n    \"\"\"\n    Function to implement\n    :return: True\n    \"\"\"\n` +
      `    # Write your code here\n    return False  # Change this\n`;
  
  // Test content
  const testContent = language === 'javascript'
    ? `// tests.js for module ${module.id}\n` +
      `const assert = require('assert');\n` +
      `const { testFunction } = require('./main');\n\n` +
      `describe('${module.title}', () => {\n` +
      `  it('testFunction should return true', () => {\n` +
      `    assert.strictEqual(testFunction(), true);\n` +
      `  });\n});\n`
    : `# tests.py for module ${module.id}\n` +
      `import unittest\n` +
      `from main import test_function\n\n` +
      `class Test${module.title.replace(/\s/g, '')}(unittest.TestCase):\n` +
      `    def test_function(self):\n` +
      `        self.assertTrue(test_function())\n\n` +
      `if __name__ == '__main__':\n` +
      `    unittest.main()\n`;
  
  // Write files directly to disk
  await vscode.workspace.fs.writeFile(readmeUri, Buffer.from(readmeContent, 'utf8'));
  await vscode.workspace.fs.writeFile(mainUri, Buffer.from(mainContent, 'utf8'));
  await vscode.workspace.fs.writeFile(testUri, Buffer.from(testContent, 'utf8'));
}

// Export this helper function so it can be used by the ProgressManager
export { createModuleFiles };