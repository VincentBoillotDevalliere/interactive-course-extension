import * as vscode from 'vscode';
import * as fs from 'fs';

export interface CourseManifest {
  name: string;
  language: string;
  modules: ModuleInfo[];
  currentModule: string;
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
      manifest.modules[currentModuleIndex + 1].status = 'active';
      manifest.currentModule = manifest.modules[currentModuleIndex + 1].id;
    }
    
    await this.saveManifest(manifest);
    return manifest;
  }
}