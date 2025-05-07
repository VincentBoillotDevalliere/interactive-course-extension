import * as vscode from 'vscode';
import { ProgressManager, CourseManifest, ModuleInfo } from '../progression/progressManager';

export class ModuleTreeProvider implements vscode.TreeDataProvider<ModuleItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModuleItem | undefined | null | void> = new vscode.EventEmitter<ModuleItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ModuleItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private progressManager: ProgressManager;
  
  constructor() {
    this.progressManager = new ProgressManager();
  }
  
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModuleItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ModuleItem): Promise<ModuleItem[]> {
    if (element) {
      return [];
    }
    
    const manifest = await this.progressManager.loadManifest();
    if (!manifest) {
      return [];
    }
    
    return manifest.modules.map(module => this.createModuleItem(module, manifest));
  }
  
  private createModuleItem(module: ModuleInfo, manifest: CourseManifest): ModuleItem {
    const isCurrent = module.id === manifest.currentModule;
    
    let contextValue = module.status;
    if (isCurrent) {
      contextValue += 'Current';
    }
    
    const moduleItem = new ModuleItem(
      module.title,
      this.getModuleCollapsibleState(module),
      module.id,
      contextValue
    );
    
    moduleItem.iconPath = this.getIconForStatus(module.status, isCurrent);
    
    return moduleItem;
  }
  
  private getModuleCollapsibleState(module: ModuleInfo): vscode.TreeItemCollapsibleState {
    return module.status === 'locked' 
      ? vscode.TreeItemCollapsibleState.None 
      : vscode.TreeItemCollapsibleState.Collapsed;
  }
  
  private getIconForStatus(status: string, isCurrent: boolean): vscode.ThemeIcon {
    if (status === 'locked') {
      return new vscode.ThemeIcon('lock');
    } else if (status === 'completed') {
      return new vscode.ThemeIcon('check');
    } else if (isCurrent) {
      return new vscode.ThemeIcon('play');
    } else {
      return new vscode.ThemeIcon('book');
    }
  }
}

class ModuleItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly moduleId: string,
    public readonly contextValue: string
  ) {
    super(label, collapsibleState);
    
    this.tooltip = `Module: ${label}`;
    this.description = moduleId;
    
    // Only allow opening non-locked modules
    if (contextValue !== 'locked') {
      this.command = {
        command: 'extension.openModule',
        title: 'Open module',
        arguments: [moduleId]
      };
    }
  }
}