import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ExerciseFunctions {
  name: string;
  description: string;
  hint?: string;
  jsTemplate: string;
  jsTest: string;
  additionalFiles?: { fileName: string; description: string; template?: string; dependencies?: string[] }[];
}

export async function loadExerciseAssets(moduleId: string) {
  const extensionPath = vscode.extensions
    .getExtension('yourName.interactive-course-extension')!
    .extensionPath;
  const assetsDir = path.join(extensionPath, 'src', 'assets', 'exercises', moduleId);

  // try new "chapter" format
  const infoPath = path.join(assetsDir, 'chapter-info.json');
  if (fs.existsSync(infoPath)) {
    const chapter = JSON.parse(await fs.promises.readFile(infoPath, 'utf8'));
    const files = (await fs.promises.readdir(assetsDir))
      .filter(f => f.endsWith('.json') && f !== 'chapter-info.json');
    const exercises = await Promise.all(
      files.map(f => fs.promises.readFile(path.join(assetsDir, f), 'utf8').then(JSON.parse))
    );
    return { ...chapter, exercises };
  }

  // fallback to legacy single-file
  const legacy = path.join(path.dirname(assetsDir), `${moduleId}.json`);
  if (fs.existsSync(legacy)) {
    return JSON.parse(await fs.promises.readFile(legacy, 'utf8'));
  }

  return undefined;
}

export async function getExerciseContent(moduleId: string): Promise<ExerciseFunctions[]> {
  const asset = await loadExerciseAssets(moduleId);
  if (asset?.exercises?.length) return asset.exercises;

  // minimal fallback
  return [
    {
      name: 'defaultFunction',
      description: 'Placeholder',
      jsTemplate: `function defaultFunction() {\n  // TODO\n}`,
      jsTest: `it("should implement defaultFunction", () => { assert.fail("Not implemented"); });`
    }
  ];
}
