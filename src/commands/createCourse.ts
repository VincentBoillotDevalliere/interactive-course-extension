import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

  // 3. Dynamically discover available modules from the assets/exercises folder
  const modules = await discoverAvailableModules();
  
  const manifest = {
    name: `Programming Course - ${language.charAt(0).toUpperCase() + language.slice(1)}`,
    language: language,
    modules: modules,
    currentModule: modules.length > 0 ? modules[0].id : '',
    version: '1.1.0'
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
  if (modules.length > 0) {
    try {
      // Only create the first module
      await createModuleFiles(courseFolderUri, modules[0], language, true);
    } catch (error) {
      vscode.window.showErrorMessage(`Error creating module files: ${error}`);
      return;
    }
    
    // 6. Open first module
    const exUri = vscode.Uri.joinPath(courseFolderUri, modules[0].id, 'exercise.md');
    
    try {
      const doc = await vscode.workspace.openTextDocument(exUri);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Error opening module file: ${error}`);
    }

    vscode.window.showInformationMessage(`Course "${manifest.name}" created! Complete the first module to unlock the next one.`);
  } else {
    vscode.window.showWarningMessage('No exercise modules found. Please add exercise files to the assets/exercises folder.');
  }
  
  // 7. Refresh modules tree view
  vscode.commands.executeCommand('extension.refreshModules');
}

// Type definition for module exercise content
interface ExerciseFunctions {
  name: string;
  description: string;
  jsTemplate: string;
  pyTemplate: string;
  jsTest: string;
  pyTest: string;
}

// Interface for assets files structure
interface ExerciseAsset {
  id: string;
  title: string;
  exercises: ExerciseFunctions[];
  resources: {
    javascript: string[];
    python: string[];
  };
}

// Enhanced module content generator
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
  
  // Get exercise content based on module ID
  const exerciseContent = await getExerciseContent(module.id, module.title);
  
  // Create exercise readme with more comprehensive content
  const readmeContent = await generateReadmeContent(module, ext, exerciseContent);
  
  // Main file content with multiple functions based on module
  const mainContent = language === 'javascript' 
    ? generateJsMainContent(module, exerciseContent)
    : generatePyMainContent(module, exerciseContent);
  
  // Test content with multiple test cases
  const testContent = language === 'javascript'
    ? generateJsTestContent(module, exerciseContent)
    : generatePyTestContent(module, exerciseContent);
  
  // Write files directly to disk
  await vscode.workspace.fs.writeFile(readmeUri, Buffer.from(readmeContent, 'utf8'));
  await vscode.workspace.fs.writeFile(mainUri, Buffer.from(mainContent, 'utf8'));
  await vscode.workspace.fs.writeFile(testUri, Buffer.from(testContent, 'utf8'));
}

// Load exercise assets from files
async function loadExerciseAssets(moduleId: string): Promise<ExerciseAsset | undefined> {
  try {
    // Get extension context to resolve asset paths
    const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
    if (!extensionPath) {
      throw new Error('Could not find extension path');
    }
    
    const assetsPath = path.join(extensionPath, 'src', 'assets', 'exercises');
    const assetFilePath = path.join(assetsPath, `${moduleId}.json`);
    
    // Check if asset file exists
    if (!fs.existsSync(assetFilePath)) {
      console.warn(`No exercise asset found for module ${moduleId}`);
      return undefined;
    }
    
    // Read and parse the asset file
    const assetContent = await fs.promises.readFile(assetFilePath, 'utf8');
    return JSON.parse(assetContent) as ExerciseAsset;
  } catch (error) {
    console.error(`Error loading exercise assets for ${moduleId}:`, error);
    return undefined;
  }
}

// Generate detailed README content
async function generateReadmeContent(module: any, ext: string, exerciseContent: ExerciseFunctions[]): Promise<string> {
  try {
    const { loadMarkdownTemplate, loadModuleMetadata } = require('../utils/templateLoader');
    
    // Try to load the Markdown template
    let content = await loadMarkdownTemplate(module.id);
    
    // If no specific template found, use the base template
    if (!content) {
      content = await loadMarkdownTemplate('base-template');
    }
    
    // If we have a Markdown template, use it
    if (content) {
      // Replace basic placeholders
      content = content.replace(/{{moduleId}}/g, module.id);
      content = content.replace(/{{moduleTitle}}/g, module.title);
      content = content.replace(/{{extension}}/g, ext);
      content = content.replace(/{{moduleTitle\.toLowerCase\(\)}}/g, module.title.toLowerCase());
      
      // Process function list
      let functionList = '';
      exerciseContent.forEach(func => {
        functionList += `   - \`${func.name}\`: ${func.description}\n`;
      });
      content = content.replace(/{{functionList}}/g, functionList);
      
      // Process resources
      let resourceLinks = '';
      // First try to load metadata
      const metadata = await loadModuleMetadata(module.id);
      
      if (metadata && metadata.resources) {
        // Use language-specific resources if available
        const resources = metadata.resources[ext === 'js' ? 'javascript' : 'python'] || [];
        if (resources.length > 0) {
          resources.forEach((link: string) => {
            const linkText = link.replace(/https?:\/\/([^\/]+)\/.*/, '$1'); // Extract domain name
            resourceLinks += `- [${linkText}](${link})\n`;
          });
        }
      }
      
      content = content.replace(/{{resourceLinks}}/g, resourceLinks);
      
      return content;
    } else {
      // Basic fallback content if no template is found
      return `# Module ${module.id}: ${module.title}\n\n## Instructions\n\n1. Open the main.${ext} file\n2. Implement the required functions\n3. Run the tests to validate your solution`;
    }
  } catch (error) {
    console.error('Error generating README content:', error);
    // Minimal fallback content in case the system fails
    return `# Module ${module.id}: ${module.title}\n\n## Instructions\n\nImplement the required functions in main.${ext} and run tests to validate your solution.`;
  }
}

// Generate JavaScript main file content
function generateJsMainContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// main.js file for module ${module.id}: ${module.title}\n\n`;
  
  // Add each function template
  exerciseFunctions.forEach(func => {
    content += `/**\n * ${func.description}\n */\n`;
    content += func.jsTemplate;
    content += `\n\n`;
  });
  
  // Add exports at the end
  content += `module.exports = {\n`;
  const exports = exerciseFunctions.map(func => `  ${func.name}`).join(',\n');
  content += exports + '\n};';
  
  return content;
}

// Generate Python main file content
function generatePyMainContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# main.py file for module ${module.id}: ${module.title}\n\n`;
  
  // Add each function template
  exerciseFunctions.forEach(func => {
    content += `def ${func.name}:\n    """\n    ${func.description}\n    """\n`;
    content += func.pyTemplate;
    content += `\n\n`;
  });
  
  return content;
}

// Generate JavaScript test content
function generateJsTestContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// tests.js for module ${module.id}: ${module.title}\n`;
  content += `const assert = require('assert');\n`;
  
  // Import the functions to test
  content += `const { ${exerciseFunctions.map(f => f.name).join(', ')} } = require('./main');\n\n`;
  
  // Create test suite
  content += `describe('${module.title} Tests', () => {\n`;
  
  // Add test cases for each function
  exerciseFunctions.forEach(func => {
    content += `  describe('${func.name}', () => {\n`;
    content += func.jsTest;
    content += `  });\n\n`;
  });
  
  content += `});\n`;
  return content;
}

// Generate Python test content
function generatePyTestContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# tests.py for module ${module.id}: ${module.title}\n`;
  content += `import unittest\n`;
  content += `from main import ${exerciseFunctions.map(f => f.name).join(', ')}\n\n`;
  
  // Create test class
  const className = `Test${module.title.replace(/\s/g, '')}`;
  content += `class ${className}(unittest.TestCase):\n`;
  
  // Add test methods for each function
  exerciseFunctions.forEach(func => {
    content += func.pyTest;
    content += '\n';
  });
  
  content += `\nif __name__ == '__main__':\n`;
  content += `    unittest.main()\n`;
  
  return content;
}

// Get specific exercise content for each module
async function getExerciseContent(moduleId: string, moduleTitle: string): Promise<ExerciseFunctions[]> {
  // Load exercise content from assets file
  const asset = await loadExerciseAssets(moduleId);
  
  if (asset && asset.exercises && asset.exercises.length > 0) {
    return asset.exercises;
  }
  
  // If no exercise file is found, provide a minimal fallback
  console.warn(`No exercise file found for module ${moduleId}, using minimal fallback`);
  return [
    {
      name: "defaultFunction",
      description: "A placeholder function that needs to be implemented",
      jsTemplate: "function defaultFunction() {\n  // TODO: Implement this function\n  \n}",
      pyTemplate: "    # TODO: Implement this function\n    pass",
      jsTest: "    it(\"should be implemented\", () => {\n      assert.fail(\"Not implemented yet\");\n    });",
      pyTest: "    def test_default_function(self):\n        self.fail(\"Function not implemented yet\")"
    }
  ];
}

// Discover available modules by scanning the assets/exercises folder
async function discoverAvailableModules(): Promise<any[]> {
  try {
    // Get extension context to resolve asset paths
    const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
    if (!extensionPath) {
      throw new Error('Could not find extension path');
    }
    
    const assetsPath = path.join(extensionPath, 'src', 'assets', 'exercises');
    
    // Read all JSON files in the exercises folder
    const files = await fs.promises.readdir(assetsPath);
    const moduleFiles = files.filter(file => file.endsWith('.json'));
    
    // For each module file, load its metadata and add to modules array
    const modules = await Promise.all(moduleFiles.map(async file => {
      const filePath = path.join(assetsPath, file);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const asset = JSON.parse(content) as ExerciseAsset;
      
      return {
        id: asset.id,
        title: asset.title,
        status: 'locked' // Default status, can be changed later
      };
    }));
    
    return modules;
  } catch (error) {
    console.error('Error discovering available modules:', error);
    return [];
  }
}

// Export this helper function so it can be used by the ProgressManager
export { createModuleFiles };