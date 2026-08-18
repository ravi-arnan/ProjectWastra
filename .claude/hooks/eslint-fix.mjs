// PostToolUse hook: run eslint --fix on the edited JS/TS file using the repo's local eslint.
// Reads the Claude Code tool-call payload from stdin, extracts tool_input.file_path,
// and lints only that file. Failures are swallowed so a lint error never blocks edits.
// Uses execFileSync (no shell) so a crafted file path can never inject a command.
import { execFileSync } from 'node:child_process';

let data = '';
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  try {
    const file = JSON.parse(data)?.tool_input?.file_path;
    if (!file || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) return;
    const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    execFileSync('npx', ['--no-install', 'eslint', '--fix', file], {
      cwd,
      stdio: 'ignore',
      timeout: 60_000,
    });
  } catch {
    // eslint not installed, file outside project, or lint failure — do not block.
  }
});
