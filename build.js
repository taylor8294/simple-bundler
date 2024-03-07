import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import buildComponents from './modules/buildComponents.js';

async function buildCss() {
  try {
    //execSync('npm run build:css', { stdio: 'inherit' });
    spawn('npm.cmd', ['run', 'build:css']);
    console.log('called build:css');
  } catch (error) {
    console.error(error);
  }
}

(async function () {

  const jsFolderPath = './js/';
  const jsFiles = fs.readdirSync(jsFolderPath);

  let output = '';

  for (const file of jsFiles) {
    if (file == 'components.js') continue; //components.js handled via buildComponents below
    const filePath = path.join(jsFolderPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    output += `//\n// ${file}\n//\n\n${fileContent}\n\n`;
  }

  output += "\n//\n// components.js\n//\n\n" + (await buildComponents());

  fs.writeFileSync(path.join(__dirname, 'public', 'scripts', 'bundle.js'), output);
  console.log('bundle.js written successfully');

  // Build CSS
  await buildCss();
})();