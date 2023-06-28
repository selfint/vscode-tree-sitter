import * as assert from "assert";

import * as vscode from "vscode";
import * as vscodeTreeSitter from "../../extension";

import { afterEach, beforeEach } from "mocha";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function downloadParser(
    parsersDir: string,
    npmPackageName: string,
    subdirectory?: string
): Promise<boolean> {
    let number = 0;
    return await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title: `Installing ${npmPackageName}`,
        },
        async (progress) => {
            return await vscodeTreeSitter.Installer.downloadParser(
                parsersDir,
                npmPackageName,
                subdirectory,
                (data) => progress.report({ message: data, increment: number++ })
            );
        }
    );
}

suite("FileTree Test Suite", function () {
    this.timeout(process.env.INSTALLER_TIMEOUT ?? 10 * 60 * 1000);
    let tempParsersDir: string | undefined = undefined;

    beforeEach(async () => {
        await vscodeTreeSitter.Parser.init();
        tempParsersDir = await mkdtemp(join(tmpdir(), "vscode-tree-sitter-download-test-"));
    });

    afterEach(async () => {
        if (tempParsersDir !== undefined) {
            await rm(tempParsersDir, { recursive: true, force: true });
        }
    });

    test("Test Rust", async () => {
        assert.ok(tempParsersDir);

        const text = "fn main() {   }";
        assert.ok(await downloadParser(tempParsersDir, "tree-sitter-rust"));
        const rust = await vscodeTreeSitter.Installer.loadParser(tempParsersDir, "tree-sitter-rust");
        assert.ok(rust);

        const tree = await vscodeTreeSitter.FileTree.openFile(rust, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    }).timeout(999999999);

    test("Test Typescript", async () => {
        assert.ok(tempParsersDir);

        const text = "function main() {}";
        assert.ok(await downloadParser(tempParsersDir, "tree-sitter-typescript", "typescript"));
        const typescript = await vscodeTreeSitter.Installer.loadParser(
            tempParsersDir,
            "tree-sitter-typescript"
        );
        assert.ok(typescript);

        const tree = await vscodeTreeSitter.FileTree.openFile(typescript, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });

    test("Test TSX", async () => {
        assert.ok(tempParsersDir);

        const text = "function main() { }";
        assert.ok(await downloadParser(tempParsersDir, "tree-sitter-typescript", "tsx"));
        const tsx = await vscodeTreeSitter.Installer.loadParser(
            tempParsersDir,
            "tree-sitter-typescript",
            "tree-sitter-tsx"
        );
        assert.ok(tsx);

        const tree = await vscodeTreeSitter.FileTree.openFile(tsx, text);
        assert.strictEqual(tree.tree.rootNode.text, text);
    });
});
