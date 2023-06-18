import * as assert from "assert";

import * as vscodeTreeSitter from "../../extension";

//@ts-expect-error ignore missing types
import Rust = require("tree-sitter-rust");

//@ts-expect-error ignore missing types
import Typescript = require("tree-sitter-typescript");

suite("FileTree Test Suite", () => {
    test("Test Rust", () => {
        const text = "fn main() {   }";
        const tree = vscodeTreeSitter.FileTree.openFile(Rust, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });

    test("Test Typescript", () => {
        const text = "function main() {}";
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const tree = vscodeTreeSitter.FileTree.openFile(Typescript.typescript, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });
});
