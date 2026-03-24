import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const watch = process.argv.includes('--watch')

mkdirSync('dist', { recursive: true })

// Build the sandbox code (runs in Figma's main thread)
const codeConfig = {
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2020',
  format: 'iife',
  minify: !watch,
}

// Build the UI code (bundled inline into HTML)
const uiConfig = {
  entryPoints: ['src/ui.ts'],
  bundle: true,
  outfile: 'dist/ui.bundle.js',
  target: 'es2020',
  format: 'iife',
  minify: !watch,
}

async function buildAll() {
  await Promise.all([
    esbuild.build(codeConfig),
    esbuild.build(uiConfig),
  ])

  // Inline the JS bundle into the HTML shell
  const html = readFileSync('src/ui.html', 'utf-8')
  const js = readFileSync('dist/ui.bundle.js', 'utf-8')
  const inlined = html.replace('<!-- BUNDLE -->', `<script>${js}</script>`)
  writeFileSync('dist/ui.html', inlined)

  console.log('✓ Build complete')
}

if (watch) {
  const codeCtx = await esbuild.context(codeConfig)
  const uiCtx = await esbuild.context(uiConfig)

  await codeCtx.watch()
  await uiCtx.watch()

  console.log('👀 Watching for changes...')
  // Rebuild HTML on change — esbuild watch doesn't trigger our inline step,
  // so we use a simple polling approach for the HTML
  setInterval(async () => {
    try {
      const html = readFileSync('src/ui.html', 'utf-8')
      const js = readFileSync('dist/ui.bundle.js', 'utf-8')
      const inlined = html.replace('<!-- BUNDLE -->', `<script>${js}</script>`)
      writeFileSync('dist/ui.html', inlined)
    } catch { /* ignore during mid-write */ }
  }, 1000)
} else {
  await buildAll()
}
