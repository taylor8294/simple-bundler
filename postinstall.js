import fs from 'fs';
import path from 'path';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';

const escodegenPath = './node_modules/escodegen/escodegen.js';

function patchESCodeGenToSupportPropertyDefinition() {

  // check escodegenPath is accessible
  if (!fs.existsSync(escodegenPath)) {
    console.error('escodegen.js file not found');
    return;
  }

  // read escodegenPath
  const escodegenJs = fs.readFileSync(escodegenPath);

  // check if already patched
  if(escodegenJs.indexOf('PropertyDefinition')<0){

    // Create a backup file
    let backupFilePath = escodegenPath + '.original', count = 0;
    while(fs.existsSync(backupFilePath)) {
      count += 1;
      backupFilePath = `escodegen (${count}).js.original`
    }
    fs.copyFileSync(escodegenPath, backupFilePath);
    console.log('Backup file created successfully:', backupFilePath);

    // parse escodegenJs
    const ast = acorn.parse(escodegenJs, { ecmaVersion: 'latest', sourceType: 'module' });

    // find CodeGenerator.Expression assignment
    let assignmentNode = null;
    try {
      walk.simple(ast, {
        AssignmentExpression(node) {
          if (
            node.left.type === 'MemberExpression' &&
            node.left.object.name === 'CodeGenerator' &&
            node.left.property.name === 'Expression'
          ) {
            assignmentNode = node;
            throw new Error('stop')
          }
        }
      });
    } catch(e){
      if(e.message!=='stop') throw e;
    }
    if (!assignmentNode) {
      console.error('CodeGenerator.Expression assignment not found in escodegen.js file');
      return;
    }

    // find index of the CodeGenerator.Expression.Property property
    let propertyIndex = assignmentNode.right.properties.findIndex(property => property.key.name === 'Property');

    // add CodeGenerator.Expression.PropertyDefintion after CodeGenerator.Expression.Property
    const newProperty = `const Expression = {
      PropertyDefinition: function (expr, precedence, flags) {
        var result;

        if (expr.static) {
          result = ['static '];
        } else {
          result = [];
        }

        result.push(this.generatePropertyKey(expr.key, expr.computed));

        if (expr.value) {
          result.push( space + '=' + space);
          result.push(this.generateExpression(expr.value, Precedence.Assignment, E_TTT));
        }

        result.push(this.semicolon(flags));

        return result;
      }
    }`;
    const newPropertyAst = acorn.parse(newProperty, { ecmaVersion: 'latest', sourceType: 'module' });
    assignmentNode.right.properties.splice(propertyIndex + 1, 0, newPropertyAst.body[0].declarations[0].init.properties[0]);

    // generate patched JS (with new property added)
    const patchedEscodegenJs = escodegen.generate(ast, {format:{indent:{style: '  '}}});

    // write patch to file
    fs.writeFileSync(escodegenPath, patchedEscodegenJs);
    console.log('escodegen.js patched successfully')

  } else {
    console.log('escodegen.js already patched')
  }
}

patchESCodeGenToSupportPropertyDefinition();