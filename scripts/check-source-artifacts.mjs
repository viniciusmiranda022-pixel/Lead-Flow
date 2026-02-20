import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const isFixMode = process.argv.includes('--fix');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'target']);
const CHECK_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.rs',
  '.toml',
  '.css',
  '.svg',
  '.md',
  '.yml',
  '.yaml',
]);
const CHECK_BASENAMES = new Set(['package.json', 'tauri.conf.json']);

const codexLinePattern = /^\s*codex\/[\w.-]+\s*$/;
const mergeMarkerPattern = /^(<{7}|={7}|>{7})/;

function walk(dir, files) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = relative(root, fullPath);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(fullPath, files);
      continue;
    }

    const ext = extname(entry);
    if (CHECK_EXTENSIONS.has(ext) || CHECK_BASENAMES.has(entry)) {
      files.push(relPath);
    }
  }
}

function parseStrictJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${path} inválido: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const files = [];
walk(root, files);

const findings = [];
for (const file of files) {
  const abs = join(root, file);
  const lines = readFileSync(abs, 'utf8').split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (codexLinePattern.test(line)) {
      findings.push(`${file}:${i + 1} contém token de branch acidental: ${line.trim()}`);
    }
    if (mergeMarkerPattern.test(line)) {
      findings.push(`${file}:${i + 1} contém marcador de conflito: ${line.trim()}`);
    }
  }
}

try {
  parseStrictJson('package.json');
  const tauriConf = parseStrictJson('src-tauri/tauri.conf.json');

  const iconPaths = [
    ...(Array.isArray(tauriConf?.bundle?.icon) ? tauriConf.bundle.icon : []),
    ...(typeof tauriConf?.bundle?.windows?.icon === 'string' ? [tauriConf.bundle.windows.icon] : []),
  ];

  const requiresIco = iconPaths.some((path) => /icon\.ico$/i.test(path));
  if (requiresIco) {
    const iconExists = iconPaths.some((path) => {
      try {
        return statSync(join(root, 'src-tauri', path)).isFile();
      } catch {
        return false;
      }
    });

    if (!iconExists) {
      findings.push(
        'src-tauri/tauri.conf.json referencia icon.ico, mas o arquivo não existe e não há geração automática configurada.',
      );
    }
  }
} catch (error) {
  findings.push(error instanceof Error ? error.message : String(error));
}

if (isFixMode) {
  console.warn('Modo --fix não é suportado neste guardrail. Corrija os arquivos manualmente.');
}

if (findings.length > 0) {
  console.error('Falha na verificação de integridade de fontes:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Integridade de fontes validada com sucesso.');
