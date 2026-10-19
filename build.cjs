// Package only public website files for Amplify Hosting. No dependencies required.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const output = path.join(root, 'dist');
const files = [
  'index.html', 'services.html', 'faq.html', 'styles.css',
  'script.js', 'slideshows.js', 'faq.js', 'scroll-cue.js', 'reviews.js'
];
for (const file of [...files, 'images']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing website asset: ${file}`);
}
// The generated output is always the dist directory directly inside this project.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid output directory');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('dist must not be a symbolic link');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, 'images'), path.join(output, 'images'), { recursive: true });
console.log('Amplify website ready in dist/');
