import * as assert from "assert";
import * as vscodeTreeSitter from "../../extension";

//@ts-expect-error ignore missing types
import Rust = require("tree-sitter-rust");

suite("vendor/node-tree-sitter Test Suite", () => {
    test("Test Rust parser", () => {
        const p = new vscodeTreeSitter.Parser();
        p.setLanguage(Rust);

        const tree = p.parse("fn main() {}");

        assert.strictEqual(
            tree.rootNode.toString(),
            "(source_file (function_item name: (identifier) parameters: (parameters) body: (block)))"
        );
    });

    test("Test TSNode methods", () => {
        const p = new vscodeTreeSitter.Parser();
        p.setLanguage(Rust);

        const rootNode = p.parse("fn main() {}").rootNode;
        assert.ok(rootNode.child(0) !== null);
    });
});
