import * as vscode from 'vscode';
import { ProgressManager, CourseManifest, ModuleInfo } from '../progression/progressManager';
import { CourseUtils } from '../utils/courseUtils';

export class ModuleTreeProvider implements vscode.TreeDataProvider<ModuleItem>, vscode.Disposable {
  private _onDidChangeTreeData: vscode.EventEmitter<ModuleItem | undefined | null | void> = new vscode.EventEmitter<ModuleItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ModuleItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private progressManager: ProgressManager;
  private activeModuleInEditor: string | undefined;
  private _refreshInterval: NodeJS.Timer;
  private _disposables: vscode.Disposable[] = [];
  
  constructor() {
    this.progressManager = new ProgressManager();
    
    // Set up interval to check if active editor is showing a different module
    this._refreshInterval = setInterval(async () => {
      const newModuleId = await CourseUtils.getCurrentModuleId();
      if (newModuleId !== this.activeModuleInEditor) {
        this.activeModuleInEditor = newModuleId;
        this.refresh();
      }
    }, 5000); // Check every 5 seconds
    
    // Listen for editor changes
    const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(async () => {
      const newModuleId = await CourseUtils.getCurrentModuleId();
      if (newModuleId !== this.activeModuleInEditor) {
        this.activeModuleInEditor = newModuleId;
        this.refresh();
      }
    });
    
    this._disposables.push(editorChangeListener);
  }
  
  // Implementation of vscode.Disposable
  dispose() {
    clearInterval(this._refreshInterval);
    this._disposables.forEach(d => d.dispose());
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
    // Check if this module is highlighted in the editor but not yet the current module
    const isHighlighted = module.id === this.activeModuleInEditor && module.id !== manifest.currentModule;
    
    const isCurrent = module.id === manifest.currentModule;
    
    let contextValue = module.status;
    if (isCurrent) {
      contextValue += 'Current';
    }
    if (isHighlighted) {
      contextValue += 'Highlighted';
    }
    
    const moduleItem = new ModuleItem(
      module.title,
      this.getModuleCollapsibleState(module),
      module.id,
      contextValue
    );
    
    moduleItem.iconPath = this.getIconForStatus(module.status, isCurrent, isHighlighted);
    
    // Add a description for the module being edited
    if (isHighlighted) {
      moduleItem.description = `${module.id} (editing)`;
    } else {
      moduleItem.description = module.id;
    }
    
    return moduleItem;
  }
  
  private getModuleCollapsibleState(module: ModuleInfo): vscode.TreeItemCollapsibleState {
    return module.status === 'locked' 
      ? vscode.TreeItemCollapsibleState.None 
      : vscode.TreeItemCollapsibleState.Collapsed;
  }
  
  private getIconForStatus(status: string, isCurrent: boolean, isHighlighted: boolean): vscode.ThemeIcon {
    if (status === 'locked') {
      return new vscode.ThemeIcon('lock');
    } else if (status === 'completed') {
      return new vscode.ThemeIcon('check');
    } else if (isHighlighted) {
      return new vscode.ThemeIcon('edit');
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
