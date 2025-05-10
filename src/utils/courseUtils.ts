// filepath: /Users/vincentboillotdevalliere/Documents/interactive-course-extension/interactive-course-extension/src/utils/courseUtils.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProgressManager } from '../progression/progressManager';

/**
 * Helper functions to work with course modules
 */
export class CourseUtils {
  /**
   * Extract a module ID from a file path using various known patterns
   * @param filePath Path to check for module ID
   * @returns The extracted module ID or undefined if not found
   */
  public static extractModuleIdFromPath(filePath: string): string | undefined {
    if (!filePath) {
      return undefined;
    }
    
    // Try different patterns for module IDs
    
    // Pattern 1: /01-moduleName/ in path
    let match = filePath.match(/[\\/](0\d-\w+(-\w+)*)[\\/]/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 2: /exercises/01-moduleName/ in path
    match = filePath.match(/[\\/]exercises[\\/](0\d-\w+(-\w+)*)[\\/]/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 3: filename like 01-moduleName-exerciseName.js
    match = filePath.match(/(0\d-\w+(-\w+)*)-\w+\.\w+$/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 4: directory like /assets/exercises/01-moduleName/
    match = filePath.match(/[\\/]assets[\\/]exercises[\\/](0\d-\w+(-\w+)*)[\\/]/);
    if (match && match[1]) {
      return match[1];
    }
    
    return undefined;
  }
  
  /**
   * Get the current module ID from the active editor or the course manifest
   * @returns The current module ID or undefined if it cannot be determined
   */
  public static async getCurrentModuleId(): Promise<string | undefined> {
    // First try to get from active editor
    if (vscode.window.activeTextEditor) {
      const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
      const moduleId = this.extractModuleIdFromPath(filePath);
      
      if (moduleId) {
        return moduleId;
      }
    }
    
    // If not found in active editor, try to get from manifest
    try {
      const progressManager = new ProgressManager();
      const manifest = await progressManager.loadManifest();
      
      if (manifest) {
        return manifest.currentModule;
      }
    } catch (error) {
      console.error('Error loading manifest:', error);
    }
    
    return undefined;
  }
  
  /**
   * Check if a file belongs to a specific module
   * @param filePath Path to check
   * @param moduleId Module ID to check against
   * @returns True if the file belongs to the specified module
   */
  public static fileMatchesModule(filePath: string, moduleId: string): boolean {
    if (!filePath || !moduleId) {
      return false;
    }
    
    // Check if the file path contains the module ID in a valid pattern
    return filePath.includes(`/${moduleId}/`) || 
           filePath.includes(`\\${moduleId}\\`) ||
           filePath.includes(`/exercises/${moduleId}/`) ||
           filePath.includes(`\\exercises\\${moduleId}\\`) ||
           filePath.includes(`/assets/exercises/${moduleId}/`) ||
           filePath.includes(`\\assets\\exercises\\${moduleId}\\`) ||
           filePath.match(new RegExp(`${moduleId}-\\w+\\.\\w+$`)) !== null;
  }
  
  /**
   * Find test files related to a module ID
   * @param moduleId The module ID to find test files for
   * @returns Array of file paths for test files
   */
  public static async findModuleTestFiles(moduleId: string): Promise<string[]> {
    if (!moduleId) {
      console.error('No module ID provided to findModuleTestFiles');
      return [];
    }
    
    // If moduleId is an object, try to get the id property
    if (typeof moduleId !== 'string') {
      console.error(`Invalid moduleId type: ${typeof moduleId}. Expected string.`);
      return [];
    }
    
    const testFiles: string[] = [];
    
    try {
      // Find course directory (containing course.json)
      const files = await vscode.workspace.findFiles('**/course.json');
      if (files.length > 0) {
        const courseDir = path.dirname(files[0].fsPath);
        
        // Check common test file locations
        const potentialTestPaths = [
          path.join(courseDir, moduleId, `tests.js`),
          path.join(courseDir, moduleId, `tests.py`),
          path.join(courseDir, 'tests', moduleId, `tests.js`),
          path.join(courseDir, 'tests', moduleId, `tests.py`)
        ];
        
        for (const testPath of potentialTestPaths) {
          if (fs.existsSync(testPath)) {
            testFiles.push(testPath);
          }
        }
      }
      
      // Look for tests in exercise files
      const exerciseFiles = await vscode.workspace.findFiles(`**/assets/exercises/${moduleId}/*.json`);
      if (exerciseFiles.length > 0) {
        console.log(`[DEBUG] Found ${exerciseFiles.length} exercise files for module ${moduleId}`);
        testFiles.push(...exerciseFiles.map(file => file.fsPath));
      } else {
        console.log(`[DEBUG] No exercise files found for module ${moduleId}`);
      }
    } catch (error) {
      console.error(`Error finding test files for module ${moduleId}:`, error);
    }
    
    return testFiles;
  }
}