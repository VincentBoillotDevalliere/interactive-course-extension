import * as vscode from 'vscode';

export class CodeHighlighter {
  private todoDecorationType: vscode.TextEditorDecorationType;
  private commentRegex: { [key in 'javascript' | 'python']: RegExp } = {
    'javascript': /\/\/\s*(.+)/g,
    'python': /#\s*(.+)/g
  };
  private todoPattern = /(TODO|FIXME|to implement|change this|write your code)/i;

  constructor() {
    // Create decoration type for TODO comments
    this.todoDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 216, 76, 0.2)',
      border: '1px solid rgba(255, 216, 76, 0.5)',
      isWholeLine: false,
      overviewRulerColor: 'rgba(255, 216, 76, 0.7)',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      after: {
        contentText: ' 📝 ',
        color: 'rgba(255, 216, 76, 0.7)'
      }
    });
  }

  public updateDecorations(editor: vscode.TextEditor): void {
    if (!editor) {
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const language = this.getLanguageFromPath(filePath);
    
    if (!language) {
      return;
    }

    const text = editor.document.getText();
    const todoDecorations: vscode.DecorationOptions[] = [];
    
    // Use the appropriate regex based on language
    const regex = this.commentRegex[language];
    let match;

    // Find todo comments
    while ((match = regex.exec(text))) {
      const commentText = match[1];
      if (this.todoPattern.test(commentText)) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        
        const decoration = { 
          range: new vscode.Range(startPos, endPos),
          hoverMessage: new vscode.MarkdownString(`**Task to complete:** ${commentText}`)
        };
        
        todoDecorations.push(decoration);
      }
    }

    // Look for return false; // Change this or similar patterns
    if (language === 'javascript') {
      const returnFalseRegex = /return\s+false;\s*\/\/\s*([Cc]hange this|[Tt]o [Mm]odify)/g;
      while ((match = returnFalseRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        
        const decoration = { 
          range: new vscode.Range(startPos, endPos),
          hoverMessage: new vscode.MarkdownString(`**Update this code:** Change the return value to make the test pass`)
        };
        
        todoDecorations.push(decoration);
      }
    } else if (language === 'python') {
      const returnFalseRegex = /return\s+False\s*#\s*([Cc]hange this|[Tt]o [Mm]odify)/g;
      while ((match = returnFalseRegex.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        
        const decoration = { 
          range: new vscode.Range(startPos, endPos),
          hoverMessage: new vscode.MarkdownString(`**Update this code:** Change the return value to make the test pass`)
        };
        
        todoDecorations.push(decoration);
      }
    }

    // Apply decorations
    editor.setDecorations(this.todoDecorationType, todoDecorations);
  }

  private getLanguageFromPath(filePath: string): 'javascript' | 'python' | null {
    if (filePath.endsWith('.js')) {
      return 'javascript';
    } else if (filePath.endsWith('.py')) {
      return 'python';
    }
    return null;
  }

  public dispose() {
    this.todoDecorationType.dispose();
  }
}