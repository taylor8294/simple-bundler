import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find nodes that extend a given Class
function getExtendsNodes(ast, className) {
  if(Array.isArray(ast)){
    if(ast.length > 1){
      ast = {
        type: "BlockStatement",
        body: ast,
      }
    } else if(ast.length > 0) ast = ast[0];
    else return;
  }
  let extendsNodes = [];
  // Traverse the AST to find all blocks that extend the given className
  walk.simple(ast, {
    ClassDeclaration(node) {
      if (node.superClass && (className ? node.superClass.name === className : true)) {
        extendsNodes.push(node);
      }
    },
  });
  return extendsNodes;
}

// Ensure methods of class call super first
function superCheck(ast, methods){
  if(Array.isArray(ast)){
    if(ast.length > 1){
      ast = {
        type: "BlockStatement",
        body: ast,
      }
    } else if(ast.length > 0) ast = ast[0];
    else return;
  }
  if(!methods || !methods.length){
    methods = ['constructor'];
  }
  let classNodes = [];
  if(ast.type === 'ClassDeclaration' && ast.superClass){
    classNodes.push(ast);
  } else {
    walk.simple(ast, {
      ClassDeclaration(node) {
        if(node.superClass) classNodes.push(node);
      },
    });
  }
  if(classNodes.length){
    classNodes.forEach(classNode => {

      const found = Object.fromEntries(methods.map(methodName => [methodName, false]))

      walk.simple(classNode, {
        MethodDefinition(node) {
          if(methods.includes(node.key.name)){

            found[node.key.name] = true;

            if(node.kind == 'constructor'){

              // Handle super() in constuctor
              if (node.value.body.body.length > 0 && node.value.body.body[0].type === 'ExpressionStatement' &&
                  node.value.body.body[0].expression.type === 'CallExpression' && 
                  node.value.body.body[0].expression.callee.type === 'Super') {
                // OK.
              } else {
                // Check if super is called later in the constructor
                walk.ancestor(node.value.body, {
                  CallExpression(callNode, _state, ancestors) {
                    if (callNode.callee.type === 'Super') {
                      // Remove the existing super() call as it's not in the right place (first thing)
                      const parent = ancestors[ancestors.length-1]
                      const index = parent.body.indexOf(callNode);
                      parent.body.splice(index, 1);
                    }
                  }
                });

                // Insert a call to super() as the first line of the constructor
                node.value.body.body.unshift({
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Super' },
                    arguments: []
                  }
                });
              }
              
            } else {

              // handle for functions other than the constructor (calling super.methodName())
              if (node.value.body.body.length > 0 && node.value.body.body[0].type === 'ExpressionStatement' &&
                  node.value.body.body[0].expression.type === 'CallExpression' && 
                  node.value.body.body[0].expression.callee.type === 'MemberExpression' && 
                  node.value.body.body[0].expression.callee.object === 'Super' && 
                  node.value.body.body[0].expression.callee.property.name === node.key.name) {
                // OK.
              } else {
                // Remove any calls to super.methodName() that appear later in the method
                walk.ancestor(node.value.body, {
                  CallExpression(callNode, _state, ancestors) {
                    if (callNode.callee.type === 'MemberExpression' && 
                        callNode.callee.object.type === 'Super' && 
                        callNode.callee.property.name === node.key.name) {
                      // Remove the existing super.methodName() call as it's not in the right place (first thing)
                      const parent = ancestors[ancestors.length-1]
                      const index = parent.body.indexOf(callNode);
                      parent.body.splice(index, 1);
                    }
                  }
                });

                // Insert a call to super.methodName() as the first line of the method
                node.value.body.body.unshift({
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'CallExpression',
                    callee: {
                      type: 'MemberExpression',
                      object: {
                        type: 'Super'
                      },
                      property: {
                        type: 'Identifier',
                        name: node.key.name
                      }
                    },
                    arguments: []
                  }
                });
              }

            }

          } // if methods.includes
        }, //MethodDefinition
      }); //walk.simple

      /*
      // Add function definitions if needed
      if(!Object.values(found).every(Boolean)){
        const toAdd = Object.keys(found).filter(key => !obj[key]);
        toAdd.forEach(methodName => {
          classNode.body.body.push({
            type: 'MethodDefinition',
            key: { type: 'Identifier', name: methodName },
            value: { 
              type: 'FunctionExpression', 
              id: null, 
              params: [], 
              body: {
                type: 'BlockStatement',
                body:[{
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'CallExpression',
                    callee: methodName === 'constructor' ? 'Super' : {
                      type: 'MemberExpression',
                      object: {
                        type: 'Super'
                      },
                      property: {
                        type: 'Identifier',
                        name: methodName
                      }
                    },
                    arguments: []
                  }
                }]
              }, 
              async: false, 
              generator: false 
            },
            kind: methodName === 'constructor' ? 'constructor' : 'method',
            computed: false,
            static: false,
          });
        });
      }
      */
      
    }); //forEach
  } //if classNodes.length
}

// Function to prepend/append some lines of code to a given method within all classes in the ast
function editMethod(ast, methodName, prepend, append) {
  if(Array.isArray(ast)){
    if(ast.length > 1){
      ast = {
        type: "BlockStatement",
        body: ast,
      }
    } else if(ast.length > 0) ast = ast[0];
    else return;
  }
  let classNodes = [];
  if(ast.type === 'ClassDeclaration'){
    classNodes.push(ast);
  } else {
    walk.simple(ast, {
      ClassDeclaration(node) {
        classNodes.push(node);
      },
    });
  }
  if(classNodes.length){
    // Get prependAst and appendAst in right format for insertion
    let prependAst = prepend ? (typeof prepend === 'string' ? acorn.parse(prepend, { ecmaVersion: 'latest', sourceType: 'module' }) : prepend) : null;
    let appendAst = append ? (typeof append === 'string' ? acorn.parse(append, { ecmaVersion: 'latest', sourceType: 'module' }) : append) : null;
    if(prependAst){
      if(Array.isArray(prependAst) || !Array.isArray(prependAst.body)){
        prependAst = {
          "type": "BlockStatement",
          "body": Array.isArray(prependAst) ? prependAst : [prependAst],
        }
      }
    }
    if(appendAst){
      if(Array.isArray(appendAst) || !Array.isArray(appendAst.body)){
        appendAst = {
          "type": "BlockStatement",
          "body": Array.isArray(appendAst) ? appendAst : [appendAst],
        }
      }
    }

    classNodes.forEach(classNode => {
      let methodFound = false;
      try {
        walk.simple(classNode, {
          MethodDefinition(methodNode) {
            if (methodNode.key.name === methodName) {
              methodFound = true;
              if(prependAst){
                // Find the index after all calls to super() within the method body
                let prependIndex = 0, isSuperCall = function(node){
                  return node.type === "ExpressionStatement" && node.expression.type === "CallExpression" && (
                    node.expression.callee.type === "Super" || (node.expression.callee.type == "MemberExpression" && node.expression.callee.object.type === "Super")
                  )
                }
                while(prependIndex < methodNode.value.body.body.length && isSuperCall(methodNode.value.body.body[prependIndex])){
                  prependIndex++
                };
                methodNode.value.body.body.splice(prependIndex, 0, ...prependAst.body);
              }
              if(appendAst) methodNode.value.body.body.push(...appendAst.body);
              throw new Error("stop")
            }
          },
        });
      } catch(e){
        if(e.message !== "stop") throw e;
      }
      // If the method is not found, append the method definition to the class
      if (!methodFound) {
        // Combine prepended and appended code AST nodes
        const combinedBody = (prependAst || appendAst) ? [...(prependAst ? prependAst.body : []), ...(appendAst ? appendAst.body : [])] : null;
        if(combinedBody){
          // Insert the combined AST as the body of the method
          classNode.body.body.push({
            type: 'MethodDefinition',
            key: { type: 'Identifier', name: methodName },
            value: { 
              type: 'FunctionExpression', 
              id: null, 
              params: [], 
              body: { type: 'BlockStatement', body: combinedBody }, 
              async: false, 
              generator: false 
            },
            computed: false,
            static: false,
          });
        }
      }
    }); //forEach
  } //ifclassNodes.length
}

// Function to traverse the AST and modify the property if found
function markPropertyStatic(ast,propertyName) {
  if(Array.isArray(ast)){
    if(ast.length > 1){
      ast = {
        type: "BlockStatement",
        body: ast,
      }
    } else if(ast.length > 0) ast = ast[0];
    else return;
  }
  let classNodes = [];
  if(ast.type === 'ClassDeclaration'){
    classNodes.push(ast);
  } else {
    walk.simple(ast, {
      ClassDeclaration(node) {
        classNodes.push(node);
      },
    });
  }
  classNodes.forEach(classNode => {
    walk.simple(classNode, {
      PropertyDefinition(node) {
        if (node.key.name === propertyName) node.static = true;
      },
    });
  });
}

function handleImports(ast,pwd,importsFrom){
  if(Array.isArray(ast)){
    if(ast.length > 1){
      ast = {
        type: "BlockStatement",
        body: ast,
      }
    } else if(ast.length > 0) ast = ast[0];
    else return;
  }
  if(!pwd)
    pwd = path.resolve(__dirname, '..');
  if(importsFrom){
    if(typeof importsFrom === 'string')
      importsFrom = [importsFrom];
  }
  walk.simple(ast, {
    ImportDeclaration(node) {
      const filePathStr = node.source.value,
        filePath = path.resolve(pwd, filePathStr);
      console.log(filePath);
      // TODO
    },
  });
}

export { getExtendsNodes, superCheck, editMethod, markPropertyStatic, handleImports };