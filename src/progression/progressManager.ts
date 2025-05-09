import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createModuleFiles } from '../utils/moduleFileGenerator';

export interface CourseManifest {
  name: string;
  language: string;
  modules: ModuleInfo[];
  currentModule: string;
  version?: string; // Optional to maintain backward compatibility
}

export interface ModuleInfo {
  id: string;
  title: string;
  status: 'locked' | 'active' | 'completed';
}

export class ProgressManager {
  private manifestPath: string | undefined;

  constructor() {
    
  }

  public async loadManifest(): Promise<CourseManifest | undefined> {
    try {
      // Find course.json file in the workspace
      const files = await vscode.workspace.findFiles('**/course.json');
      if (files.length === 0) {
        return undefined;
      }
      
      this.manifestPath = files[0].fsPath;
      const data = await fs.promises.readFile(this.manifestPath, 'utf8');
      return JSON.parse(data) as CourseManifest;
    } catch (error) {
      console.error('Error loading manifest:', error);
      return undefined;
    }
  }

  public async saveManifest(manifest: CourseManifest): Promise<void> {
    if (!this.manifestPath) { throw new Error('No manifest path set'); }
    await fs.promises.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  public async completeCurrentModule(manifest: CourseManifest): Promise<CourseManifest> {
    const currentModuleIndex = manifest.modules.findIndex(m => m.id === manifest.currentModule);
    if (currentModuleIndex === -1) { return manifest; }
    
    // Mark current as completed
    manifest.modules[currentModuleIndex].status = 'completed';
    
    // Unlock next module if available
    if (currentModuleIndex + 1 < manifest.modules.length) {
      const nextModule = manifest.modules[currentModuleIndex + 1];
      nextModule.status = 'active';
      manifest.currentModule = nextModule.id;
      
      // Generate the next module's files
      await this.generateNextModuleFiles(manifest, nextModule);
    }
    
    await this.saveManifest(manifest);
    return manifest;
  }

  private async generateNextModuleFiles(manifest: CourseManifest, nextModule: ModuleInfo): Promise<void> {
    try {
      if (!this.manifestPath) { return; }
      
      const courseDir = path.dirname(this.manifestPath);
      const courseUri = vscode.Uri.file(courseDir);
      
      // Check if the module directory already exists
      const moduleUri = vscode.Uri.joinPath(courseUri, nextModule.id);
      try {
        await vscode.workspace.fs.stat(moduleUri);
        // If we get here, the directory exists, so we don't need to create it
        console.log(`Module ${nextModule.id} already exists, skipping creation`);
        return;
      } catch (err) {
        // Directory doesn't exist, which is what we want - create it
      }
      
      // Create the module files
      await createModuleFiles(courseUri, nextModule, manifest.language, true);
      
      vscode.window.showInformationMessage(
        `New module "${nextModule.title}" has been unlocked and generated!`
      );
      
    } catch (error) {
      console.error('Error generating next module files:', error);
      vscode.window.showErrorMessage(`Error generating module: ${error}`);
    }
  }
}