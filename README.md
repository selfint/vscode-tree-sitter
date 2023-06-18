# vscode-tree-sitter

Access your code's syntax tree via [node-tree-sitter](https://github.com/tree-sitter/node-tree-sitter).

## Features

Dynamically download and load tree-sitter parsers.

## Requirements

This extensions requires:

-   `node` & `npm`: Can be installed from [nodejs.org](https://nodejs.org/en/download) ([instructions](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)).
-   `electron-rebuild`: After `npm` is installed, `electron-rebuild` can be installed by `npm i -g electron-rebuild`.
    In the future, this requirement will be pre-packaged in the extension.

## Extension Settings

This extension contributes the following settings:

-   `vscode-tree-sitter.test`: View the current file's syntax tree, will download the relevant tree-sitter parser automatically.

## Known Issues

-   Languages with `languageId` that don't match their tree-sitter parser name aren't loaded correctly.
    Known problematic languages are:

    | Language   | LanguageId      | tree-sitter parser                |
    | ---------- | --------------- | --------------------------------- |
    | Typescript | typescript      | tree-sitter-typescript.typescript |
    | TSX        | typescriptreact | tree-sitter-typescript.tsx        |

## Release Notes

### 0.0.1

Initial release of vscode-tree-sitter!
