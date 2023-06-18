import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

import Parser = require("tree-sitter");
//@ts-expect-error ignore missing types
import Rust = require("tree-sitter-rust");

suite("Extension Test Suite", () => {
    void vscode.window.showInformationMessage("Start all tests.");

    test("Test Rust parser", () => {
        const p = new Parser();
        p.setLanguage(Rust);

        const tree = p.parse("fn main() {}");

        assert.strictEqual(
            tree.rootNode.toString(),
            "(source_file (function_item name: (identifier) parameters: (parameters) body: (block)))"
        );
    });

    test("Test TSNode methods", () => {
        const p = new Parser();
        p.setLanguage(Rust);

        const rootNode = p.parse("fn main() {}").rootNode;

        console.log(rootNode.child(0));
    });
});
