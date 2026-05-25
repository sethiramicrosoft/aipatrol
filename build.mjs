import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

// Clean dist
fs.rmSync(outdir, { recursive: true, force: true });
fs.mkdirSync(outdir, { recursive: true });

// Copy static files
fs.copyFileSync('manifest.json', path.join(outdir, 'manifest.json'));

// Copy popup if it exists
if (fs.existsSync('src/popup')) {
  fs.cpSync('src/popup', path.join(outdir, 'popup'), { recursive: true });
}

// Copy icons if they exist
if (fs.existsSync('icons')) {
  fs.cpSync('icons', path.join(outdir, 'icons'), { recursive: true });
}

const sharedConfig = {
  bundle: true,
  platform: 'browser',
  target: 'chrome100',
  sourcemap: true,
  minify: false,
};

if (watch) {
  // Watch mode
  const contentCtx = await esbuild.context({
    ...sharedConfig,
    entryPoints: ['src/content/interceptor.ts'],
    outfile: `${outdir}/content/interceptor.js`,
  });
  const swCtx = await esbuild.context({
    ...sharedConfig,
    entryPoints: ['src/service-worker.ts'],
    outfile: `${outdir}/service-worker.js`,
    format: 'esm',
  });
  await Promise.all([contentCtx.watch(), swCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([
    esbuild.build({
      ...sharedConfig,
      entryPoints: ['src/content/interceptor.ts'],
      outfile: `${outdir}/content/interceptor.js`,
    }),
    esbuild.build({
      ...sharedConfig,
      entryPoints: ['src/service-worker.ts'],
      outfile: `${outdir}/service-worker.js`,
      format: 'esm',
    }),
  ]);
  console.log('Build complete →', outdir);
}
