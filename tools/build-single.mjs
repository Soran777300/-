// 単一 HTML ファイル版 (dist/*.html) を生成する。
//
//   npx esbuild@0.24 --version >/dev/null   # 初回のみ取得
//   node tools/build-single.mjs
//
// three.js と全モジュールを 1 枚の HTML に畳み込むので、サーバを立てずに
// ブラウザで直接開ける (file:// でも動く)。配布・収録用。

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  {
    entry: 'src/main-zeruel.js',
    out: 'dist/zeruel.html',
    title: '第10使徒 迎撃戦 — ネルフ本部 侵攻 / 3D 俯瞰 作戦記録',
  },
  {
    entry: 'src/main.js',
    out: 'dist/yashima.html',
    title: 'ヤシマ作戦 — 3D 俯瞰 作戦記録 / OPERATION YASHIMA',
  },
];

const css = await readFile(resolve(root, 'src/style.css'), 'utf8');
await mkdir(resolve(root, 'dist'), { recursive: true });

for (const t of TARGETS) {
  const bundled = await build({
    entryPoints: [resolve(root, t.entry)],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify: true,
    write: false,
    alias: {
      // importmap と同じ解決を esbuild にも与える
      'three/addons': resolve(root, 'vendor/three/addons'),
      three: resolve(root, 'vendor/three/three.module.js'),
    },
  });

  // インラインスクリプト中の </script はパーサに拾われるため退避する
  const js = bundled.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t.title}</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<div id="loading">MAGI — LOADING TERRAIN DATA …</div>
<script type="module">
${js}
</script>
</body>
</html>
`;

  await writeFile(resolve(root, t.out), html);
  console.log(`${t.out} — ${(html.length / 1024).toFixed(0)} KB`);
}
