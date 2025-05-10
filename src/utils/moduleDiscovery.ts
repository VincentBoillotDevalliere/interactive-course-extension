import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function discoverAvailableModules(): Promise<{ id: string; title: string; status: string }[]> {
  const extensionPath = vscode.extensions
    .getExtension('yourName.interactive-course-extension')!
    .extensionPath;
  const assetsPath = path.join(extensionPath, 'src', 'assets', 'exercises');

  const items = await fs.promises.readdir(assetsPath);
  const modules: { id: string; title: string; status: string }[] = [];

  for (const item of items) {
    const itemPath = path.join(assetsPath, item);
    const stats = await fs.promises.stat(itemPath);

    if (stats.isDirectory()) {
      const infoPath = path.join(itemPath, 'chapter-info.json');
      if (fs.existsSync(infoPath)) {
        const info = JSON.parse(await fs.promises.readFile(infoPath, 'utf8'));
        modules.push({ id: info.id, title: info.title, status: 'locked' });
      }
    } else if (item.endsWith('.json')) {
      const asset = JSON.parse(await fs.promises.readFile(path.join(assetsPath, item), 'utf8'));
      modules.push({ id: asset.id, title: asset.title, status: 'locked' });
    }
  }
  
  // Set the first module as active instead of locked
  if (modules.length > 0) {
    modules[0].status = 'active';
    console.log('Set first module as active:', modules[0].id);
  }

  return modules;
}
