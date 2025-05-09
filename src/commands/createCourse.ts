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
  additionalFiles?: {
    fileName: string;
    description: string;
    template?: string;
    dependencies?: string[]; // Optional array of other files this file depends on
  }[];
  chapterId?: string; // For backward compatibility
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
  
  // Get exercise content based on module ID
  const exerciseContent = await getExerciseContent(module.id, module.title);
  
  // Create exercise readme with more comprehensive content
  const readmeContent = await generateReadmeContent(module, ext, exerciseContent);
  await vscode.workspace.fs.writeFile(readmeUri, Buffer.from(readmeContent, 'utf8'));
  
  // Create an exercises directory to store individual exercise files
  const exercisesDir = vscode.Uri.joinPath(moduleDir, 'exercises');
  await vscode.workspace.fs.createDirectory(exercisesDir);
  
  // Create a tests directory to store individual test files
  const testsDir = vscode.Uri.joinPath(moduleDir, 'tests');
  await vscode.workspace.fs.createDirectory(testsDir);
  
  // Create master index file that imports all modules
  const indexContent = language === 'javascript'
    ? generateJsIndexFile(module, exerciseContent)
    : generatePyIndexFile(module, exerciseContent);
  
  const indexUri = vscode.Uri.joinPath(moduleDir, `index.${ext}`);
  await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent, 'utf8'));
  
  // Create individual files for each exercise
  for (let i = 0; i < exerciseContent.length; i++) {
    const exercise = exerciseContent[i];
    const safeFileName = getSafeFileName(exercise.name);
    
    if (language === 'javascript') {
      // For JavaScript, create a directory for each exercise to support multiple files
      const exerciseDirUri = vscode.Uri.joinPath(exercisesDir, safeFileName);
      await vscode.workspace.fs.createDirectory(exerciseDirUri);
      
      // Create the main implementation file (index.js) for this exercise
      const mainFileContent = generateJsExerciseMainFile(exercise);
      const mainFileUri = vscode.Uri.joinPath(exerciseDirUri, 'index.js');
      await vscode.workspace.fs.writeFile(mainFileUri, Buffer.from(mainFileContent, 'utf8'));
      
      // Create additional files for the exercise
      await createJsAdditionalFiles(exerciseDirUri, exercise);
    } else {
      // For Python, keep the original approach with a single file
      const exerciseFileContent = generatePyExerciseContent(exercise);
      const exerciseFileUri = vscode.Uri.joinPath(exercisesDir, `${safeFileName}.${ext}`);
      await vscode.workspace.fs.writeFile(exerciseFileUri, Buffer.from(exerciseFileContent, 'utf8'));
    }
    
    // Create the test file for this exercise (same for both languages)
    const testFileContent = language === 'javascript'
      ? generateJsIndividualTestContent(module, exercise, safeFileName)
      : generatePyIndividualTestContent(module, exercise, safeFileName);
    
    const testFileUri = vscode.Uri.joinPath(testsDir, `${safeFileName}.test.${ext}`);
    await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(testFileContent, 'utf8'));
  }
  
  // Create a master test file that runs all tests
  const masterTestContent = language === 'javascript'
    ? generateJsMasterTestFile(module, exerciseContent)
    : generatePyMasterTestFile(module, exerciseContent);
  
  const testUri = vscode.Uri.joinPath(moduleDir, `tests.${ext}`);
  await vscode.workspace.fs.writeFile(testUri, Buffer.from(masterTestContent, 'utf8'));
  
  console.log(`[DEBUG] Created module files at ${moduleDir.fsPath}: exercise.md, exercises/*, tests/*, index.${ext}, tests.${ext}`);
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
    
    // First try the new directory structure (chapter folder)
    const chapterFolderPath = path.join(assetsPath, moduleId);
    const chapterInfoPath = path.join(chapterFolderPath, 'chapter-info.json');
    
    console.log(`[DEBUG] Loading exercise assets for module ${moduleId}`);
    console.log(`[DEBUG] Chapter folder path: ${chapterFolderPath}`);
    console.log(`[DEBUG] Chapter info path: ${chapterInfoPath}`);
    console.log(`[DEBUG] Chapter folder exists: ${fs.existsSync(chapterFolderPath)}`);
    console.log(`[DEBUG] Chapter info exists: ${fs.existsSync(chapterInfoPath)}`);
    
    // If the chapter directory and info file exist, use the new structure
    if (fs.existsSync(chapterFolderPath) && fs.existsSync(chapterInfoPath)) {
      console.log(`[DEBUG] Using new chapter structure for ${moduleId}`);
      // Read chapter info
      const chapterInfoContent = await fs.promises.readFile(chapterInfoPath, 'utf8');
      const chapterInfo = JSON.parse(chapterInfoContent);
      
      // Read all exercise files in the chapter directory
      const exerciseFiles = await fs.promises.readdir(chapterFolderPath);
      const exerciseJsonFiles = exerciseFiles.filter(file => 
        file.endsWith('.json') && file !== 'chapter-info.json'
      );
      
      console.log(`[DEBUG] Found ${exerciseJsonFiles.length} exercise files in ${moduleId}`);
      
      // Load each exercise file
      const exercises = await Promise.all(exerciseJsonFiles.map(async (file) => {
        const exerciseFilePath = path.join(chapterFolderPath, file);
        const exerciseContent = await fs.promises.readFile(exerciseFilePath, 'utf8');
        return JSON.parse(exerciseContent);
      }));
      
      // Combine into a complete asset
      return {
        id: chapterInfo.id,
        title: chapterInfo.title,
        exercises: exercises,
        resources: chapterInfo.resources || { javascript: [], python: [] }
      };
    }
    
    // Fall back to the old structure if necessary
    const legacyAssetFilePath = path.join(assetsPath, `${moduleId}.json`);
    
    console.log(`[DEBUG] Legacy asset file path: ${legacyAssetFilePath}`);
    console.log(`[DEBUG] Legacy asset file exists: ${fs.existsSync(legacyAssetFilePath)}`);
    
    // Check if legacy asset file exists
    if (fs.existsSync(legacyAssetFilePath)) {
      console.log(`[DEBUG] Using legacy structure for ${moduleId}`);
      // Read and parse the legacy asset file
      const assetContent = await fs.promises.readFile(legacyAssetFilePath, 'utf8');
      return JSON.parse(assetContent) as ExerciseAsset;
    }
    
    console.warn(`No exercise asset found for module ${moduleId}`);
    return undefined;
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
    console.log(`[DEBUG] Looking for modules in path: ${assetsPath}`);
    
    const files = await fs.promises.readdir(assetsPath);
    console.log(`[DEBUG] Found ${files.length} items in exercises directory:`, files);
    
    const modules: any[] = [];
    
    // Process all items in the exercises folder
    for (const item of files) {
      const itemPath = path.join(assetsPath, item);
      const stats = await fs.promises.stat(itemPath);
      
      if (stats.isDirectory()) {
        // If it's a directory, look for chapter-info.json
        const chapterInfoPath = path.join(itemPath, 'chapter-info.json');
        console.log(`[DEBUG] Checking for chapter info in: ${chapterInfoPath}`);
        
        if (fs.existsSync(chapterInfoPath)) {
          const content = await fs.promises.readFile(chapterInfoPath, 'utf8');
          const chapterInfo = JSON.parse(content);
          console.log(`[DEBUG] Found chapter: ${chapterInfo.id}`);
          
          modules.push({
            id: chapterInfo.id,
            title: chapterInfo.title,
            status: 'locked' // Default status
          });
        } else {
          console.log(`[DEBUG] No chapter-info.json found in directory: ${item}`);
        }
      } else if (item.endsWith('.json')) {
        // If it's a JSON file (legacy format), add it to modules
        console.log(`[DEBUG] Processing legacy JSON file: ${item}`);
        
        const filePath = path.join(assetsPath, item);
        const content = await fs.promises.readFile(filePath, 'utf8');
        const asset = JSON.parse(content) as ExerciseAsset;
        
        modules.push({
          id: asset.id,
          title: asset.title,
          status: 'locked' // Default status
        });
      }
    }
    
    console.log(`[DEBUG] Discovered ${modules.length} modules:`, modules);
    return modules;
  } catch (error) {
    console.error('Error discovering available modules:', error);
    return [];
  }
}
 


// Export this helper function so it can be used by the ProgressManager
export { createModuleFiles };

/**
 * Helper function to convert function name to safe filename
 */
function getSafeFileName(functionName: string): string {
  // Convert camelCase to kebab-case and remove any invalid characters
  return functionName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Generate JS index file that imports and exports all exercise functions
 */
function generateJsIndexFile(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// index.js for module ${module.id}: ${module.title}\n`;
  content += `// This file imports and exports all functions from individual exercise files\n\n`;
  
  // Import statements
  exerciseFunctions.forEach(func => {
    const safeFileName = getSafeFileName(func.name);
    content += `const { ${func.name} } = require('./exercises/${safeFileName}/index');\n`;
  });
  
  content += '\n// Export all functions\n';
  content += 'module.exports = {\n';
  const exports = exerciseFunctions.map(func => `  ${func.name}`).join(',\n');
  content += exports + '\n};';
  
  return content;
}

/**
 * Generate Python index file that imports and exports all exercise functions
 */
function generatePyIndexFile(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# index.py for module ${module.id}: ${module.title}\n`;
  content += `# This file imports and makes available all functions from individual exercise files\n\n`;
  
  // Import statements
  exerciseFunctions.forEach(func => {
    const safeFileName = getSafeFileName(func.name);
    content += `from exercises.${safeFileName} import ${func.name}\n`;
  });
  
  content += `\n# No need to explicitly export symbols in Python\n`;
  content += `# All imported symbols are available when importing this file\n`;
  
  return content;
}


/**
 * Generate JavaScript content for an exercise directory's main file
 */
function generateJsExerciseMainFile(exercise: ExerciseFunctions): string {
  let content = '';
  
  content += `/**\n * ${exercise.description}\n * Main file for the ${exercise.name} exercise.\n */\n`;
  
  // Add imports for additional files if they exist
  if (exercise.additionalFiles && exercise.additionalFiles.length > 0) {
    content += '\n// Import helper functions from other files\n';
    exercise.additionalFiles.forEach(file => {
      const safeFileName = getSafeFileName(file.fileName);
      content += `const ${safeFileName}Functions = require('./${safeFileName}');\n`;
    });
    content += '\n';
  } else {
    // Default imports for the standard helper and extra files
    content += '\n// Import helper functions\n';
    content += `const helperFunctions = require('./helper');\n`;
    content += `const extraFunctions = require('./extra');\n\n`;
  }
  
  content += exercise.jsTemplate;
  content += `\n\n`;
  
  // Add exports
  content += `module.exports = { ${exercise.name} };\n`;
  
  return content;
}

/**
 * Generate a helper JavaScript file template
 */
function generateJsHelperFile(exercise: ExerciseFunctions, helperName: string): string {
  let content = '';
  
  content += `/**\n * Helper functions for ${exercise.name} exercise\n */\n\n`;
  content += `/**\n * Example helper function for the ${exercise.name} exercise\n * @param {any} data - The data to process\n * @returns {any} The processed data\n */\n`;
  content += `function ${helperName}(data) {\n  // Implement your helper function here\n  return data;\n}\n\n`;
  
  // Add exports
  content += `module.exports = { ${helperName} };\n`;
  
  return content;
}

/**
 * Generate JavaScript test content for an individual exercise
 */
function generateJsIndividualTestContent(module: any, exercise: ExerciseFunctions, fileName: string): string {
  let content = `// Test file for ${exercise.name} in module ${module.id}\n`;
  content += `const assert = require('assert');\n\n`;
  
  // Import the function from its exercise file
  content += `const { ${exercise.name} } = require('../exercises/${fileName}/index');\n\n`;
  
  // Create test suite
  content += `describe('${exercise.name} Tests', () => {\n`;
  content += exercise.jsTest;
  content += `});\n`;
  
  return content;
}

/**
 * Generate Python test content for an individual exercise
 */
function generatePyIndividualTestContent(module: any, exercise: ExerciseFunctions, fileName: string): string {
  let content = `# Test file for ${exercise.name} in module ${module.id}\n`;
  content += `import unittest\n`;
  
  // Import the function from its exercise file
  content += `from exercises.${fileName} import ${exercise.name}\n\n`;
  
  // Create test class
  const className = `Test${exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)}`;
  content += `class ${className}(unittest.TestCase):\n`;
  content += exercise.pyTest;
  content += `\n\nif __name__ == '__main__':\n`;
  content += `    unittest.main()\n`;
  
  return content;
}

/**
 * Generate a master JavaScript test file that runs all tests
 */
function generateJsMasterTestFile(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// Master test file for module ${module.id}: ${module.title}\n`;
  content += `// This file runs all tests for this module\n\n`;
  
  // Import the test framework
  content += `const Mocha = require('mocha');\n`;
  content += `const path = require('path');\n`;
  content += `const fs = require('fs');\n\n`;
  
  // Create mocha instance
  content += `// Create mocha instance\n`;
  content += `const mocha = new Mocha();\n\n`;
  
  // Add all test files
  content += `// Add all test files\n`;
  content += `const testDir = path.join(__dirname, 'tests');\n`;
  content += `fs.readdirSync(testDir)\n`;
  content += `  .filter(file => file.endsWith('.test.js'))\n`;
  content += `  .forEach(file => {\n`;
  content += `    mocha.addFile(path.join(testDir, file));\n`;
  content += `  });\n\n`;
  
  // Run the tests
  content += `// Run the tests\n`;
  content += `mocha.run(failures => {\n`;
  content += `  process.exitCode = failures ? 1 : 0;\n`;
  content += `});\n`;
  
  return content;
}

/**
 * Generate a master Python test file that runs all tests
 */
function generatePyMasterTestFile(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# Master test file for module ${module.id}: ${module.title}\n`;
  content += `# This file runs all tests for this module\n\n`;
  
  content += `import unittest\n`;
  content += `import os\n`;
  content += `import importlib\n`;
  content += `import glob\n\n`;
  
  // Discover and load all test modules
  content += `# Collect all tests from the tests directory\n`;
  content += `def load_tests(loader, tests, pattern):\n`;
  content += `    test_dir = os.path.join(os.path.dirname(__file__), 'tests')\n`;
  content += `    test_files = glob.glob(os.path.join(test_dir, '*.test.py'))\n`;
  content += `    \n`;
  content += `    # Convert file paths to module names\n`;
  content += `    for test_file in test_files:\n`;
  content += `        module_name = os.path.basename(test_file)[:-3]  # Remove .py extension\n`;
  content += `        module_path = f'tests.{module_name}'\n`;
  content += `        try:\n`;
  content += `            # Try to import the module and add its tests\n`;
  content += `            module = importlib.import_module(module_path)\n`;
  content += `            tests.addTests(loader.loadTestsFromModule(module))\n`;
  content += `        except ImportError as e:\n`;
  content += `            print(f'Error importing {module_path}: {e}')\n`;
  content += `    \n`;
  content += `    return tests\n\n`;
  
  content += `if __name__ == '__main__':\n`;
  content += `    unittest.main()\n`;
  
  return content;
}

/**
 * Generate Python content for a single exercise file
 */
function generatePyExerciseContent(exercise: ExerciseFunctions): string {
  let content = '';
  
  content += `def ${exercise.name}:\n    """\n    ${exercise.description}\n    """\n`;
  content += exercise.pyTemplate;
  content += `\n\n`;
  
  return content;
}

/**
 * Generate an additional JavaScript file for an exercise
 * This can be used to extend exercises with more files as needed
 */
function generateJsAdditionalFile(exercise: ExerciseFunctions, fileName: string, description: string, initialContent: string = '', dependencies: string[] = []): string {
  let content = '';
  
  content += `/**\n * ${description}\n * Additional file for the ${exercise.name} exercise.\n */\n\n`;
  
  // Add imports for dependencies if provided
  if (dependencies && dependencies.length > 0) {
    content += '// Import dependencies\n';
    dependencies.forEach(dep => {
      const safeDep = getSafeFileName(dep);
      content += `const ${safeDep}Functions = require('./${safeDep}');\n`;
    });
    content += '\n';
  }
  
  // Add initial content if provided, otherwise add a template
  if (initialContent) {
    content += initialContent;
  } else {
    content += `// Add your implementation here\n\n`;
    content += `/**\n * Example function for ${fileName}\n * @param {any} data - Input data\n * @returns {any} - Processed data\n */\n`;
    content += `function ${fileName}Function(data) {\n  // Your implementation goes here\n  return data;\n}\n\n`;
  }
  
  // Add exports
  content += `module.exports = {\n  ${fileName}Function\n};\n`;
  
  return content;
}

/**
 * Create additional JavaScript files for an exercise
 * @param exerciseDirUri The URI of the exercise directory
 * @param exercise The exercise definition
 */
async function createJsAdditionalFiles(exerciseDirUri: vscode.Uri, exercise: ExerciseFunctions): Promise<void> {
  // Always create a default helper file if no additional files are defined
  if (!exercise.additionalFiles || exercise.additionalFiles.length === 0) {
    // Create a helper file as an example of splitting functionality
    const helperName = `${exercise.name}Helper`;
    const helperFileContent = generateJsHelperFile(exercise, helperName);
    const helperFileUri = vscode.Uri.joinPath(exerciseDirUri, 'helper.js');
    await vscode.workspace.fs.writeFile(helperFileUri, Buffer.from(helperFileContent, 'utf8'));
    
    // Generate a default extra JavaScript file as an example
    const additionalFileContent = generateJsAdditionalFile(exercise, 'extra', 'Extra functionality for the exercise');
    const additionalFileUri = vscode.Uri.joinPath(exerciseDirUri, 'extra.js');
    await vscode.workspace.fs.writeFile(additionalFileUri, Buffer.from(additionalFileContent, 'utf8'));
    return;
  }
  
  // Create each additional file specified in the exercise
  for (const additionalFile of exercise.additionalFiles) {
    const safeFileName = getSafeFileName(additionalFile.fileName);
    const fileName = `${safeFileName}.js`;
    
    // Generate content for this additional file
    const fileContent = additionalFile.template 
      ? generateJsAdditionalFile(exercise, safeFileName, additionalFile.description, additionalFile.template, additionalFile.dependencies)
      : generateJsAdditionalFile(exercise, safeFileName, additionalFile.description, '', additionalFile.dependencies);
    
    // Create the file
    const fileUri = vscode.Uri.joinPath(exerciseDirUri, fileName);
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(fileContent, 'utf8'));
  }
}