import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

import Parser = require("tree-sitter");
//@ts-expect-error ignore missing types
import Javascript = require("tree-sitter-javascript");

suite("Extension Test Suite", () => {
    void vscode.window.showInformationMessage("Start all tests.");

    test("Test Rust parser", () => {
        const p = new Parser();
        p.setLanguage(Javascript);

        const tree = p.parse("function main() {}");

        assert.strictEqual(
            tree.rootNode.toString(),
            "(program (function_declaration name: (identifier) parameters: (formal_parameters) body: (statement_block)))"
        );
    });

    test("Test TSNode methods", () => {
        const p = new Parser();
        p.setLanguage(Javascript);

        const rootNode = p.parse("function main() {}").rootNode;

        console.log(rootNode.child(0));
    });
});
