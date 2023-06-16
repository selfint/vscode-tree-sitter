import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
    void vscode.window.showInformationMessage("Start all tests.");

    test("Test Rust parser", async () => {
        const Parser = await import("tree-sitter");
        //@ts-expect-error ignore missing types
        const Rust = (await import("tree-sitter-rust")) as object;
        const p = new Parser();

        p.setLanguage(Rust);

        const tree = p.parse("fn main() {}");

        assert.strictEqual(
            tree.rootNode.toString(),
            "(source_file (function_item name: (identifier) parameters: (parameters) body: (block)))"
        );
    });
});
