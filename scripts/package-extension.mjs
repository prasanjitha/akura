import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
// Python's standard library creates a fresh ZIP on macOS/Linux without adding a dependency.
execFileSync('python3', ['-c', `
import pathlib, sys, zipfile
source, target = map(pathlib.Path, sys.argv[1:])
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob('*')):
        if file.is_file() and file.name != '.DS_Store':
            archive.write(file, file.relative_to(source))
`, fileURLToPath(new URL('extension/', root)), fileURLToPath(new URL('dist/akura-extension.zip', root))]);
console.log('Created dist/akura-extension.zip');
