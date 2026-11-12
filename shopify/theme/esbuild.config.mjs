// Bundles src/js/index.mjs into a single classic script, assets/elaraa.js,
// loaded with `defer` from layout/theme.liquid. Pass --watch for dev.
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['src/js/index.mjs'],
  outfile: 'assets/elaraa.js',
  bundle: true,
  format: 'iife',
  target: 'es2019',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
