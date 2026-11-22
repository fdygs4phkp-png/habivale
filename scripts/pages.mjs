// Nach `expo export`: Ausgabe nach docs/ kopieren, damit GitHub Pages sie aus main/docs zeigen kann.
// .nojekyll verhindert, dass GitHub den Ordner _expo versteckt. 404.html = index.html (Reload auf Unterseiten).
import { cpSync, rmSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
rmSync('docs', { recursive: true, force: true });
cpSync('dist', 'docs', { recursive: true });
writeFileSync('docs/.nojekyll', '');
if (existsSync('docs/index.html') && !existsSync('docs/404.html')) copyFileSync('docs/index.html', 'docs/404.html');
console.log('docs/ bereit für GitHub Pages');
