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

  // If this is the first module, create a getting-started guide in the root directory
  if (isActive && module.id.startsWith('01-')) {
    const gettingStartedContent = await loadMarkdownTemplate('getting-started') || '';
    if (gettingStartedContent) {
      await writeFile(rootUri, 'README.md', gettingStartedContent);
    }
  }

  // 1. README
  const readmeContent = await generateReadme(module, ext, exerciseContent);
  await writeFile(moduleDir, 'lesson.md', readmeContent);

  // 2. scaffold test directory
  const testsDir = vscode.Uri.joinPath(moduleDir, 'tests');
  await vscode.workspace.fs.createDirectory(testsDir);

  // 3. Create exercises directory
  const exercisesDir = vscode.Uri.joinPath(moduleDir, 'exercises');
  await vscode.workspace.fs.createDirectory(exercisesDir);

  // 4. Create individual exercise files in the exercises directory
  for (const exercise of exerciseContent) {
    const fileName = toSafeName(exercise.name);

    // create exercise file in the exercises directory
    if (language === 'javascript') {
      // Create a simplified file without imports to helper files
      await writeFile(exercisesDir, `${fileName}.${ext}`, generateExerciseMainSimplified(exercise));
    }

    // create individual test file
    const testName = `${fileName}.test.${ext}`;
    await writeFile(testsDir, testName, generateIndividualTestSimplified(module, exercise, fileName));
  }
  
  // 5. Create master index that imports from the exercises folder
  await writeFile(moduleDir, `index.${ext}`, generateIndexSimplified(module, exerciseContent));
  await writeFile(moduleDir, `tests.${ext}`, generateMasterTest(module, exerciseContent));
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
  return `# Module ${module.id}: ${module.title}\n\n## Instructions\n\n1. Open exercises/${ext} files\n2. Implement the required functions\n3. Run tests to validate your solution`;
}


/**
 * Generate a master index file that imports/exports all exercises from module-level files
 */
function generateIndexSimplified(
  module: { id: string; title: string },
  exerciseFunctions: ExerciseFunctions[]
): string {
  let content = `// index.js for module ${module.id}: ${module.title}\n`;
  content += `// Imports and exports all functions\n\n`;

  exerciseFunctions.forEach(func => {
    const safeName = toSafeName(func.name);
    content += `const { ${func.name} } = require('./exercises/${safeName}');\n`;
  });

  content += `\nmodule.exports = {\n`;
  content += exerciseFunctions.map(f => `  ${f.name}`).join(',\n');
  content += `\n};\n`;
  return content;
}

/**
 * Generate main exercise file without importing helper files
 */
function generateExerciseMainSimplified(exercise: ExerciseFunctions): string {
  let content = `/**\n * ${exercise.description}\n */\n\n`;
  content += exercise.jsTemplate + '\n\n';
  content += `module.exports = { ${exercise.name} };\n`;
  return content;
}



/**
 * Generate an individual test file for one exercise with simplified imports
 */
function generateIndividualTestSimplified(
  module: { id: string; title: string },
  exercise: ExerciseFunctions,
  fileName: string
): string {
  let content = `// Test file for ${exercise.name} in module ${module.id}\n`;
  content += `const assert = require('assert');\n\n`;
  content += `const { ${exercise.name} } = require('../exercises/${fileName}');\n\n`;
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

