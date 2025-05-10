import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';
import { CourseUtils } from '../utils/courseUtils';


type TestStructure =
  | { type: 'javascriptSingle'; testFile: string }
  | { type: 'javascriptMulti'; moduleDir: string; masterTestFile: string }
  | { type: 'splitExercise'; moduleId: string; exercisesDir: string };

export class TestRunner {
  private outputChannel = vscode.window.createOutputChannel('Test Results');

  constructor(private language: 'javascript' | 'python') {}

  public async runTests(moduleId: string | object): Promise<boolean> {
    const moduleIdString = this.parseModuleId(moduleId);
    if (!moduleIdString) {
      return false;
    }

    const structure = await this.findTestStructure(moduleIdString);
    if (!structure) {
      vscode.window.showErrorMessage(
        `Could not find any test files for module ${moduleIdString}.`
      );
      return false;
    }

    return this.executeTests(structure);
  }

  private parseModuleId(moduleId: string | object): string | null {
    if (!moduleId) {
      console.error('[ERROR] No moduleId passed to runTests');
      vscode.window.showErrorMessage(
        'No test files found for module. ModuleId is undefined.'
      );
      return null;
    }
    if (typeof moduleId === 'string') return moduleId;

    console.error(
      `[ERROR] Invalid moduleId type: ${JSON.stringify(moduleId)}`
    );
    const anyId = moduleId as any;
    if (typeof anyId.moduleId === 'string') return anyId.moduleId;
    if (typeof anyId.id === 'string') return anyId.id;

    console.log(
      `[DEBUG] Object keys: ${Object.keys(anyId).join(', ')}`
    );
    vscode.window.showErrorMessage(
      `Invalid module format: ${JSON.stringify(moduleId)}`
    );
    return null;
  }

  private async findTestStructure(
    moduleId: string
  ): Promise<TestStructure | null> {
    try {
      const testFiles = await CourseUtils.findModuleTestFiles(moduleId);
      for (const file of testFiles) {
        if (this.language === 'javascript' && file.endsWith('.js')) {
          const dir = path.dirname(file);
          const exercisesDir = path.join(dir, 'exercises');
          const testsDir = path.join(dir, 'tests');
          if (fs.existsSync(exercisesDir) && fs.existsSync(testsDir)) {
            return { type: 'javascriptMulti', moduleDir: dir, masterTestFile: file };
          }
          return { type: 'javascriptSingle', testFile: file };
        }
        if (file.endsWith('.json')) {
          return { type: 'splitExercise', moduleId, exercisesDir: path.dirname(file) };
        }
      }
    } catch (err) {
      console.error('CourseUtils lookup failed:', err);
    }

    const courseJsons = await vscode.workspace.findFiles('**/course.json');
    const exerciseJsons = await vscode.workspace.findFiles(
      `**/assets/exercises/${moduleId}/*.json`
    );

    if (courseJsons.length > 0) {
      const courseDir = path.dirname(courseJsons[0].fsPath);
      const subpaths = [
        moduleId,
        path.join('tests', 'programming-course-javascript', moduleId)
      ];
      for (const subpath of subpaths) {
        const dir = path.join(courseDir, subpath);
        const ext = this.language === 'javascript' ? 'js' : 'py';
        const testFile = path.join(dir, `tests.${ext}`);
        if (fs.existsSync(testFile)) {
          const exercisesDir = path.join(dir, 'exercises');
          const testsDir = path.join(dir, 'tests');
          if (
            this.language === 'javascript' &&
            fs.existsSync(exercisesDir) &&
            fs.existsSync(testsDir)
          ) {
            return { type: 'javascriptMulti', moduleDir: dir, masterTestFile: testFile };
          }
          return { type: 'javascriptSingle', testFile };
        }
      }
    }

    if (exerciseJsons.length > 0 && this.language === 'javascript') {
      return { type: 'splitExercise', moduleId, exercisesDir: path.dirname(exerciseJsons[0].fsPath) };
    }
    return null;
  }

  private async executeTests(struct: TestStructure): Promise<boolean> {
    if (struct.type === 'javascriptSingle') {
      return this.runJavaScriptTests(
        struct.testFile,
        `📄 Single-file results: ${path.basename(struct.testFile)}`
      );
    }
    if (struct.type === 'javascriptMulti') {
      return this.runJavaScriptMultiTests(
        struct.moduleDir,
        struct.masterTestFile,
        `📦 Module tests in: ${struct.moduleDir}`
      );
    }
    return this.runSplitExerciseTests(
      struct.moduleId,
      struct.exercisesDir,
      `🧩 Split exercises for: ${struct.moduleId}`
    );
  }

  private async runJavaScriptTests(
    testFilePath: string,
    headerMessage: string
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const tempFile = path.join(
        path.dirname(testFilePath),
        '_temp_runner.js'
      );
      try {
        const content = this.generateMochaRunner(testFilePath)

        await fs.promises.writeFile(tempFile, content);

        const proc = cp.spawn('node', [tempFile]);
        let output = '';
        proc.stdout.on('data', (data) => (output += data));
        proc.stderr.on('data', (data) => (output += data));

        proc.on('close', async (code) => {
          this.showOutput(output, headerMessage);
          await fs.promises.unlink(tempFile).catch(() => {});
          code === 0
            ? vscode.window.showInformationMessage('✅ Tests passed!')
            : vscode.window.showWarningMessage('❌ Some tests failed');
          resolve(code === 0);
        });
      } catch (err: any) {
        console.error('JS tests error:', err);
        this.showOutput(`Error: ${err.message}`, headerMessage);
        resolve(false);
      }
    });
  }

  private async runJavaScriptMultiTests(
    moduleDir: string,
    masterTestFile: string,
    headerMessage: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.outputChannel.clear();
      this.outputChannel.show();
      this.outputChannel.appendLine(`
🔷 ${headerMessage}
`);

      const proc = cp.spawn('node', [masterTestFile], {
        cwd: moduleDir,
        shell: true
      });
      proc.stdout.on('data', (data) =>
        this.outputChannel.appendLine(data.toString().trim())
      );
      proc.stderr.on('data', (data) =>
        this.outputChannel.appendLine(data.toString().trim())
      );

      proc.on('close', (code) => {
        this.outputChannel.appendLine(
          code === 0 ? '\n🎉 All module tests passed!' : `\n⚠️ Module tests failed (${code})`
        );
        resolve(code === 0);
      });
    });
  }

  private async runSplitExerciseTests(
    moduleId: string,
    exercisesDir: string,
    headerMessage: string
  ): Promise<boolean> {
    this.showOutput(
      `Scanning split exercises in ${exercisesDir}...`,
      headerMessage
    );
    // original logic omitted
    return Promise.resolve(false);
  }

  private generateMochaRunner(testFile: string): string {
    return `// Mocha runner\nconst Mocha = require('mocha');\nconst mocha = new Mocha({ reporter: 'spec', timeout: 5000 });\nmocha.addFile('${testFile.replace(/\\/g, '\\\\')}');\nmocha.run(failures => process.exit(failures ? 1 : 0));`;
  }


  /**
   * Displays formatted output with header and trimmed content
   */
  private showOutput(output: string, headerMessage: string) {
    const channel = this.outputChannel;
    channel.clear();
    channel.appendLine(`
⎯⎯⎯ ${headerMessage} ⎯⎯⎯
`);
    output.split(/\r?\n/).forEach(line => {
      if (line.trim()) channel.appendLine(`  ${line.trim()}`);
    });
    channel.show(true);
  }
}
