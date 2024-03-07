import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';

import {getExtendsNodes, superCheck, editMethod, markPropertyStatic, handleImports} from './ast.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentsDir = path.join(path.resolve(__dirname, '..'), 'components');

// Function to read file contents asynchronously
function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        //reject(err);
        resolve('');
      } else {
        resolve(data);
      }
    });
  });
}

// MyComponentName ==> my-component-name
function camelToDash(str) {
  const dashedStr = str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return dashedStr.includes('-') ? dashedStr : dashedStr + '-component';
}

// Function to build output.js
export default async function buildComponents() {
  // Get common definitions from components.js
  let output = fs.readFileSync('./js/components.js')

  try {
    // Read each component directory
    const componentDirs = await fs.promises.readdir(componentsDir);

    for (const componentDir of componentDirs) {
      const componentPath = path.join(componentsDir, componentDir);

      // Read HTML, JS, and CSS files for each component
      const html = await readFile(path.join(componentPath, `${componentDir}.html`));
      const js = await readFile(path.join(componentPath, `${componentDir}.js`));
      const css = await readFile(path.join(componentPath, `${componentDir}.css`));

      // Parse the JavaScript code
      const ast = acorn.parse(js, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      });
      const componentNodes = getExtendsNodes(ast, 'Component');
      const componentNode = componentNodes.filter(node => node.id.name == componentDir)
      if(!componentNode){
        throw new Error(`No subclass of Component with name ${componentDir} found in the component's JS file!`);
        return;
      }

      // TEST
      handleImports(ast,componentDir);

      // Check this.rendering at start of render func to avoid bugs from overlapping calls
      editMethod(componentNode,'render',
        [
          {type:"IfStatement",test:{type:"MemberExpression",object:{type:"ThisExpression"},property:{type:"Identifier",name:"rendering"},computed:!1,optional:!1},consequent:{type:"ReturnStatement",argument:null},alternate:null},
          {type:"ExpressionStatement",expression:{type:"CallExpression",callee:{type:"MemberExpression",object:{type:"Super"},property:{type:"Identifier",name:"renderStart"},computed:!1,optional:!1},arguments:[],optional:!1}}
        ],
        {type:"ExpressionStatement",expression:{type:"CallExpression",callee:{type:"MemberExpression",object:{type:"Super"},property:{type:"Identifier",name:"renderEnd"},computed:!1,optional:!1},arguments:[],optional:!1}}
      );

      // Add calls to super() where needed
      superCheck(componentNode, ['constructor','connectedCallback','attributeChangedCallback','slotChanged']);

      // Set shadow DOM in the constructor, after the call(s) to super
      const shadowDomScript = `
        this.shadowRoot.innerHTML = \`
            <style>${css.replace(/`/g, '\\`')}</style>
            ${html.replace(/`/g, '\\`')}
        \`;
      `;
      editMethod(componentNode,'constructor',shadowDomScript);

      // Add static to observedAttributes
      markPropertyStatic(componentNode,'observedAttributes');

      // Add customElements definition to the output
      ast.body.push(...(acorn.parse(`customElements.define('${camelToDash(componentDir)}', ${componentDir});`, { ecmaVersion: 'latest', sourceType: 'module' }).body));

      // Save new JS
      output += "\n" + escodegen.generate(ast, {format:{indent:{style: '  '}}});
    }

    // Write output.js
    // fs.writeFileSync(path.join(__dirname, 'public', 'scripts', 'components.js'), output);
    // console.log('components.js generated successfully!');
    return output;
  } catch (err) {
    console.error('Error:', err);
  }
}