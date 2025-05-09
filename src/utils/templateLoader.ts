import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads a markdown template from file
 */
export async function loadMarkdownTemplate(templateName: string): Promise<string | undefined> {
    try {
        // Get extension context to resolve asset paths
        const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
        if (!extensionPath) {
            throw new Error('Could not find extension path');
        }
        
        // Look for the markdown template file - first try in chapters directory
        let templatePath = path.join(extensionPath, 'src', 'assets', 'templates', 'chapters', `${templateName}.md`);
        
        // Check if template file exists in chapters directory
        if (!fs.existsSync(templatePath)) {
            // If not found, try legacy path in markdown directory
            templatePath = path.join(extensionPath, 'src', 'assets', 'templates', 'markdown', `${templateName}.md`);
            
            // Check if template file exists in markdown directory
            if (!fs.existsSync(templatePath)) {
                console.warn(`No markdown template found for ${templateName}`);
                return undefined;
            }
        }
        
        // Read the markdown file
        return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
        console.error(`Error loading markdown template for ${templateName}:`, error);
        return undefined;
    }
}

/**
 * Loads metadata for a specific module
 */
export async function loadModuleMetadata(moduleId: string): Promise<any | undefined> {
    try {
        const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
        if (!extensionPath) {
            throw new Error('Could not find extension path');
        }
        
        // Look for the metadata file
        const metadataPath = path.join(extensionPath, 'src', 'assets', 'templates', 'metadata', `${moduleId}.json`);
        
        // Check if metadata file exists
        if (!fs.existsSync(metadataPath)) {
            console.warn(`No metadata found for ${moduleId}`);
            return undefined;
        }
        
        // Read and parse the metadata file
        const metadataContent = await fs.promises.readFile(metadataPath, 'utf8');
        return JSON.parse(metadataContent);
    } catch (error) {
        console.error(`Error loading metadata for ${moduleId}:`, error);
        return undefined;
    }
}

/**
 * Helper function to get the extension path
 */
export function getExtensionPath(): string {
    const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
    if (!extensionPath) {
        throw new Error('Could not find extension path');
    }
    return extensionPath;
}

/**
 * Create a new exercise template
 * @param moduleId The module ID (e.g., '06-arrays')
 * @param moduleTitle The title of the module (e.g., 'Arrays')
 * @param exercises Array of exercise data
 * @param resources Object containing resources for JavaScript and Python
 */
export async function createExerciseTemplate(
    moduleId: string, 
    moduleTitle: string,
    exercises: Array<{
        name: string;
        description: string;
        jsTemplate: string;
        pyTemplate: string;
        jsTest: string;
        pyTest: string;
    }>,
    resources: {
        javascript: string[];
        python: string[];
    }
): Promise<boolean> {
    try {
        const extensionPath = getExtensionPath();
        
        // 1. Create chapter directory and chapter info file 
        const exercisesPath = path.join(extensionPath, 'src', 'assets', 'exercises');
        const chapterDir = path.join(exercisesPath, moduleId);
        
        // Create the chapter directory if it doesn't exist
        if (!fs.existsSync(chapterDir)) {
            await fs.promises.mkdir(chapterDir, { recursive: true });
        }
        
        // Create chapter info file
        const chapterInfoFile = path.join(chapterDir, 'chapter-info.json');
        
        const chapterInfo = {
            id: moduleId,
            title: moduleTitle,
            resources: resources
        };
        
        await fs.promises.writeFile(
            chapterInfoFile, 
            JSON.stringify(chapterInfo, null, 2)
        );
        
        // 2. Create individual exercise files
        for (const exercise of exercises) {
            const exerciseFile = path.join(chapterDir, `${moduleId}-${exercise.name}.json`);
            
            // Add chapter ID to the exercise
            const exerciseContent = {
                ...exercise,
                chapterId: moduleId
            };
            
            await fs.promises.writeFile(
                exerciseFile, 
                JSON.stringify(exerciseContent, null, 2)
            );
        }
        
        // 3. Create markdown template file
        const markdownPath = path.join(extensionPath, 'src', 'assets', 'templates', 'chapters');
        
        // Create the chapters directory if it doesn't exist
        if (!fs.existsSync(markdownPath)) {
            await fs.promises.mkdir(markdownPath, { recursive: true });
        }
        
        const markdownFile = path.join(markdownPath, `${moduleId}.md`);
        
        // Use base template as a starting point
        let baseTemplate = '';
        try {
            baseTemplate = await fs.promises.readFile(
                path.join(markdownPath, 'base-template.md'), 
                'utf8'
            );
        } catch (error) {
            console.warn('Could not find base template, creating a minimal template instead');
            baseTemplate = `# Module {{moduleId}}: {{moduleTitle}}

## Objectives

In this module, you will learn about {{moduleTitle.toLowerCase()}} and practice using them in real code examples.

## Instructions

1. Open the \`main.{{extension}}\` file
2. Implement the following functions according to their descriptions:
{{functionList}}
3. Run the tests to validate your solution
4. All tests must pass to complete this module

## Resources

{{resourceLinks}}

## Tips

- Read the function descriptions carefully
- Test your solutions incrementally
- Use console.log() or print() to debug your code
`;
        }
        
        // Customize the template with module-specific information
        baseTemplate = baseTemplate
            .replace(/{{moduleId}}/g, moduleId)
            .replace(/{{moduleTitle}}/g, moduleTitle);
            
        await fs.promises.writeFile(markdownFile, baseTemplate);
        
        // 3. Create metadata file with resources
        const metadataPath = path.join(extensionPath, 'src', 'assets', 'templates', 'metadata');
        const metadataFile = path.join(metadataPath, `${moduleId}.json`);
        
        const metadataContent = {
            resources: resources
        };
        
        await fs.promises.writeFile(
            metadataFile, 
            JSON.stringify(metadataContent, null, 2)
        );
        
        return true;
    } catch (error) {
        console.error('Error creating exercise template:', error);
        vscode.window.showErrorMessage(`Failed to create exercise template: ${error}`);
        return false;
    }
}