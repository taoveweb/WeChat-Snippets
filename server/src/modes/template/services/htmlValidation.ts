import { CLIEngine, Linter } from 'eslint';
import { configs } from 'eslint-plugin-vue';
import { TextDocument, Diagnostic, Range, DiagnosticSeverity } from 'vscode-languageserver-types';
import { resolve } from 'path';

function toDiagnostic(error: Linter.LintMessage): Diagnostic {
  const line = error.line - 1;
  const column = error.column - 1;
  const endLine = error.endLine ? error.endLine - 1 : line;
  const endColumn = error.endColumn ? error.endColumn - 1 : column;
  return {
    range: Range.create(line, column, endLine, endColumn),
    message: `\n[${error.ruleId}]\n${error.message}`,
    source: 'eslint-plugin-vue',
    severity: error.severity === 1 ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error
  };
}

export function doESLintValidation(document: TextDocument, engine: CLIEngine): Diagnostic[] {
  // 这是真正代码校验的地方
  const rawText = document.getText();
  // skip checking on empty template
  if (rawText.replace(/\s/g, '') === '') {
    return [];
  }
  const text = rawText.replace(/ {6}/, '<template><div>') + '</div></template>';
  const report = engine.executeOnText(text, document.uri);

  return report.results[0] ? report.results[0].messages.map(toDiagnostic) : [];
}

export function createLintEngine() {
  const SERVER_ROOT = resolve(__dirname, '../../../../');
  return new CLIEngine({
    useEslintrc: false,
    // So ESLint can find the bundled eslint-plugin-vue
    cwd: SERVER_ROOT,
    ...configs.base,
    ...configs.essential
  });
}
