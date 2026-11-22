// Runs `tsc --noEmit` on a worker thread with a larger stack.
// TypeScript's checker recurses deeply on this project's styled JSX and overflows Node's default ~1 MB main-thread
// stack on Windows; `node --stack-size` alone is unreliable there because it cannot grow the real OS stack.
const { Worker, isMainThread } = require('node:worker_threads');
const path = require('node:path');

if (isMainThread) {
  const w = new Worker(__filename, { resourceLimits: { stackSizeMb: 64 } });
  w.on('exit', code => process.exit(code));
  w.on('error', e => { console.error(e); process.exit(1); });
} else {
  process.argv = [process.argv[0], 'tsc', '--noEmit', '-p', path.join(__dirname, '..')];
  require('typescript/lib/tsc.js');
}
