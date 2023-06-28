import * as assert from "assert";

import * as vscodeTreeSitter from "../../extension";

suite("FileTree Test Suite", function () {
    const parsersDir = "parsers";

    test("Test Rust", async () => {
        const text = "fn main() { }";
        const rust = await vscodeTreeSitter.Installer.loadParser(parsersDir, "tree-sitter-rust");
        assert.ok(rust);

        const tree = await vscodeTreeSitter.FileTree.new(rust, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });

    test("Test Typescript", async () => {
        const text = "function main() {}";
        const typescript = await vscodeTreeSitter.Installer.loadParser(parsersDir, "tree-sitter-typescript");
        assert.ok(typescript);

        const tree = await vscodeTreeSitter.FileTree.new(typescript, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });

    test("Test TSX", async () => {
        const text = "function main() { }";
        const tsx = await vscodeTreeSitter.Installer.loadParser(
            parsersDir,
            "tree-sitter-typescript",
            "tree-sitter-tsx"
        );
        assert.ok(tsx);

        const tree = await vscodeTreeSitter.FileTree.new(tsx, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });
});
