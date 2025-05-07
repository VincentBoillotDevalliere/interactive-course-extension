import * as vscode from 'vscode';
import { createExerciseTemplate } from '../utils/templateLoader';

/**
 * Command to create a new exercise module
 */
export async function createNewExerciseModule() {
    // 1. Prompt for module ID (format check: should be like '06-arrays')
    const moduleId = await vscode.window.showInputBox({
        prompt: 'Enter the module ID (e.g., 06-arrays)',
        placeHolder: '06-arrays',
        validateInput: (value) => {
            if (!value) {
                return 'Module ID is required';
            }
            if (!/^\d{2}-[a-z-]+$/.test(value)) {
                return 'Module ID should follow the format: 06-arrays (two digits followed by hyphen and name)';
            }
            return null;
        }
    });
    
    if (!moduleId) {
        return; // User cancelled
    }
    
    // 2. Prompt for module title
    const moduleTitle = await vscode.window.showInputBox({
        prompt: 'Enter the module title',
        placeHolder: 'Arrays',
        validateInput: (value) => {
            return value ? null : 'Module title is required';
        }
    });
    
    if (!moduleTitle) {
        return; // User cancelled
    }
    
    // 3. Create a basic exercises structure
    const basicExercises = [
        {
            name: "exampleFunction",
            description: "A placeholder function that needs to be implemented",
            jsTemplate: "function exampleFunction() {\n  // TODO: Implement this function\n  \n}",
            pyTemplate: "    # TODO: Implement this function\n    pass",
            jsTest: "    it(\"should be implemented\", () => {\n      assert.fail(\"Not implemented yet\");\n    });",
            pyTest: "    def test_example_function(self):\n        self.fail(\"Function not implemented yet\")"
        }
    ];
    
    // 4. Create basic resources
    const resources = {
        javascript: [
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
            "https://javascript.info/array"
        ],
        python: [
            "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists",
            "https://realpython.com/python-lists-tuples/"
        ]
    };
    
    // 5. Create the template
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Creating exercise module "${moduleTitle}"`,
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 50 });
        
        const success = await createExerciseTemplate(
            moduleId,
            moduleTitle,
            basicExercises,
            resources
        );
        
        progress.report({ increment: 50 });
        
        if (success) {
            // 6. Offer to open the files for editing
            const openFiles = await vscode.window.showInformationMessage(
                `Exercise module "${moduleTitle}" created successfully!`,
                'Edit Exercise Files',
                'Done'
            );
            
            if (openFiles === 'Edit Exercise Files') {
                await openExerciseFiles(moduleId);
            }
        }
    });
}

/**
 * Open the exercise files for editing
 */
async function openExerciseFiles(moduleId: string) {
    try {
        const extensionPath = vscode.extensions.getExtension('yourName.interactive-course-extension')?.extensionPath;
        if (!extensionPath) {
            throw new Error('Could not find extension path');
        }
        
        const exerciseFile = vscode.Uri.file(`${extensionPath}/src/assets/exercises/${moduleId}.json`);
        const markdownFile = vscode.Uri.file(`${extensionPath}/src/assets/templates/markdown/${moduleId}.md`);
        const metadataFile = vscode.Uri.file(`${extensionPath}/src/assets/templates/metadata/${moduleId}.json`);
        
        // Open all files in editor
        const exerciseDoc = await vscode.workspace.openTextDocument(exerciseFile);
        await vscode.window.showTextDocument(exerciseDoc);
        
        const markdownDoc = await vscode.workspace.openTextDocument(markdownFile);
        await vscode.window.showTextDocument(markdownDoc, { viewColumn: vscode.ViewColumn.Beside });
        
        // Open metadata in a third column
        const metadataDoc = await vscode.workspace.openTextDocument(metadataFile);
        await vscode.window.showTextDocument(metadataDoc, { viewColumn: vscode.ViewColumn.Two });
        
        // Focus back on the exercise file
        await vscode.window.showTextDocument(exerciseDoc, { viewColumn: vscode.ViewColumn.One });
    } catch (error) {
        vscode.window.showErrorMessage(`Error opening exercise files: ${error}`);
    }
}