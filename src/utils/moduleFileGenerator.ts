import * as vscode from 'vscode';
import { getExerciseContent, ExerciseFunctions } from './exerciseAssets';
import { loadMarkdownTemplate, loadModuleMetadata } from './templateLoader';

/**
 * Main entry: scaffold a module folder with README, index, exercises, and tests
 */
export async function createModuleFiles(
  rootUri: vscode.Uri,
  module: { id: string; title: string },
  language: string,
  isActive: boolean
) {
  const ext = language === 'javascript' ? 'js' : 'py';
  const moduleDir = vscode.Uri.joinPath(rootUri, module.id);
  await vscode.workspace.fs.createDirectory(moduleDir);

  const exerciseContent = await getExerciseContent(module.id);

  // 1. README
  const readmeContent = await generateReadme(module, ext, exerciseContent);
  await writeFile(moduleDir, 'exercise.md', readmeContent);

  // 2. scaffold directories
  const exercisesDir = vscode.Uri.joinPath(moduleDir, 'exercises');
  const testsDir = vscode.Uri.joinPath(moduleDir, 'tests');
  await vscode.workspace.fs.createDirectory(exercisesDir);
  await vscode.workspace.fs.createDirectory(testsDir);

  // 3. master index & master test
  await writeFile(moduleDir, `index.${ext}`, generateIndex(module, exerciseContent));
  await writeFile(moduleDir, `tests.${ext}`, generateMasterTest(module, exerciseContent));

  // 4. individual exercises
  for (const exercise of exerciseContent) {
    const fileName = toSafeName(exercise.name);

    // create exercise folder and main file
    if (language === 'javascript') {
      const exDir = vscode.Uri.joinPath(exercisesDir, fileName);
      await vscode.workspace.fs.createDirectory(exDir);
      await writeFile(exDir, `index.${ext}`, generateExerciseMain(exercise));
      await createExtras(exDir, exercise);
    }

    // create individual test file
    const testName = `${fileName}.test.${ext}`;
    await writeFile(testsDir, testName, generateIndividualTest(module, exercise, fileName));
  }
}

/**
 * Helper to write a file
 */
async function writeFile(dir: vscode.Uri, file: string, content: string) {
  const uri = vscode.Uri.joinPath(dir, file);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
}

/**
 * Convert camelCase or arbitrary name to kebab-case safe filename
 */
function toSafeName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '');
}

/**
 * Generate README content using templates or fallback
 */
async function generateReadme(
  module: { id: string; title: string },
  ext: string,
  exerciseContent: ExerciseFunctions[]
): Promise<string> {
  // load specific or base template
  let content = await loadMarkdownTemplate(module.id) || await loadMarkdownTemplate('base-template') || '';

  if (content) {
    content = content
      .replace(/{{moduleId}}/g, module.id)
      .replace(/{{moduleTitle}}/g, module.title)
      .replace(/{{extension}}/g, ext)
      .replace(/{{moduleTitle\.toLowerCase\(\)}}/g, module.title.toLowerCase());

    // function list
    let functionList = '';
    exerciseContent.forEach(func => {
      functionList += `   - \`${func.name}\`: ${func.description}\n`;
    });
    content = content.replace(/{{functionList}}/g, functionList);

    // resource links
    let resourceLinks = '';
    const metadata = await loadModuleMetadata(module.id);
    const resources = metadata?.resources?.javascript || [];
    resources.forEach((link: string) => {
      const text = link.replace(/https?:\/\/([^\/]+)\/.*$/, '$1');
      resourceLinks += `- [${text}](${link})\n`;
    });
    content = content.replace(/{{resourceLinks}}/g, resourceLinks);

    return content;
  }

  // fallback
  return `# Module ${module.id}: ${module.title}\n\n## Instructions\n\n1. Open main.${ext}\n2. Implement the required functions\n3. Run tests to validate your solution`;
}

/**
 * Generate a master index file that imports/exports all exercises
 */
function generateIndex(
  module: { id: string; title: string },
  exerciseFunctions: ExerciseFunctions[]
): string {
  let content = `// index.js for module ${module.id}: ${module.title}\n`;
  content += `// Imports and exports all functions\n\n`;

  exerciseFunctions.forEach(func => {
    const safeName = toSafeName(func.name);
    content += `const { ${func.name} } = require('./exercises/${safeName}/index');\n`;
  });

  content += `\nmodule.exports = {\n`;
  content += exerciseFunctions.map(f => `  ${f.name}`).join(',\n');
  content += `\n};\n`;
  return content;
}

/**
 * Generate main exercise file with templates and imports
 */
function generateExerciseMain(exercise: ExerciseFunctions): string {
  let content = `/**\n * ${exercise.description}\n * Main file for the ${exercise.name} exercise.\n */\n`;

  if (exercise.additionalFiles && exercise.additionalFiles.length > 0) {
    content += '\n// Import helper functions from other files\n';
    exercise.additionalFiles.forEach(file => {
      const safe = toSafeName(file.fileName);
      content += `const ${safe} = require('./${safe}');\n`;
    });
    content += '\n';
  } else {
    content += '\n// Import helper functions\n';
    content += `const helperFunctions = require('./helper');\n`;
    content += `const extraFunctions = require('./extra');\n\n`;
  }

  content += exercise.jsTemplate + '\n\n';
  content += `module.exports = { ${exercise.name} };\n`;
  return content;
}

/**
 * Generate an individual test file for one exercise
 */
function generateIndividualTest(
  module: { id: string; title: string },
  exercise: ExerciseFunctions,
  fileName: string
): string {
  let content = `// Test file for ${exercise.name} in module ${module.id}\n`;
  content += `const assert = require('assert');\n\n`;
  content += `const { ${exercise.name} } = require('../exercises/${fileName}/index');\n\n`;
  content += `describe('${exercise.name} Tests', () => {\n`;
  content += exercise.jsTest + '\n';
  content += `});\n`;
  return content;
}

/**
 * Generate a master test runner that uses Mocha
 */
function generateMasterTest(
  module: { id: string; title: string },
  exerciseFunctions: ExerciseFunctions[]
): string {
  let content = `// Master test file for module ${module.id}: ${module.title}\n`;
  content += `// This file runs all tests for this module\n\n`;
  content += `const Mocha = require('mocha');\n`;
  content += `const path = require('path');\n`;
  content += `const fs = require('fs');\n\n`;
  content += `// Create mocha instance\n`;
  content += `const mocha = new Mocha();\n\n`;
  content += `// Add all test files\n`;
  content += `const testDir = path.join(__dirname, 'tests');\n`;
  content += `fs.readdirSync(testDir)\n`;
  content += `  .filter(file => file.endsWith('.test.js'))\n`;
  content += `  .forEach(file => mocha.addFile(path.join(testDir, file)));\n\n`;
  content += `// Run the tests\n`;
  content += `mocha.run(failures => { process.exitCode = failures ? 1 : 0; });\n`;
  return content;
}

/**
 * Create helper and extra files per exercise or use provided additionalFiles
 */
async function createExtras(
  exerciseDirUri: vscode.Uri,
  exercise: ExerciseFunctions
): Promise<void> {
  if (!exercise.additionalFiles || exercise.additionalFiles.length === 0) {
    const helperName = `${exercise.name}Helper`;
    const helperContent = generateHelperFile(exercise, helperName);
    await writeFile(exerciseDirUri, 'helper.js', helperContent);

    const extraContent = generateAdditionalFile(
      exercise,
      'extra',
      'Extra functionality for the exercise'
    );
    await writeFile(exerciseDirUri, 'extra.js', extraContent);
  } else {
    for (const file of exercise.additionalFiles) {
      const safe = toSafeName(file.fileName);
      const fileName = `${safe}.js`;
      const content = generateAdditionalFile(
        exercise,
        safe,
        file.description,
        file.template || '',
        file.dependencies || []
      );
      await writeFile(exerciseDirUri, fileName, content);
    }
  }
}

/**
 * Helper to create a default helper file
 */
function generateHelperFile(
  exercise: ExerciseFunctions,
  helperName: string
): string {
  let content = `/**\n * Helper functions for ${exercise.name} exercise\n */\n\n`;
  content += `/**\n * Example helper function for the ${exercise.name} exercise\n`;
  content += ` * @param {any} data - The data to process\n`;
  content += ` * @returns {any} The processed data\n */\n`;
  content += `function ${helperName}(data) {\n  // Implement your helper function here\n  return data;\n}\n\n`;
  content += `module.exports = { ${helperName} };\n`;
  return content;
}

/**
 * Helper to create or template an additional file
 */
function generateAdditionalFile(
  exercise: ExerciseFunctions,
  fileName: string,
  description: string,
  initialContent: string = '',
  dependencies: string[] = []
): string {
  let content = `/**\n * ${description}\n * Additional file for the ${exercise.name} exercise.\n */\n\n`;

  if (dependencies.length) {
    content += '// Import dependencies\n';
    dependencies.forEach(dep => {
      const depSafe = toSafeName(dep);
      content += `const ${depSafe} = require('./${depSafe}');\n`;
    });
    content += '\n';
  }

  if (initialContent) {
    content += initialContent;
  } else {
    content += `// Add your implementation here\n\n`;
    content += `/**\n * Example function for ${fileName}\n`;
    content += ` * @param {any} data - Input data\n`;
    content += ` * @returns {any} - Processed data\n */\n`;
    content += `function ${fileName}Function(data) {\n  // Your implementation goes here\n  return data;\n}\n\n`;
  }

  content += `module.exports = { ${fileName}Function };\n`;
  return content;
}