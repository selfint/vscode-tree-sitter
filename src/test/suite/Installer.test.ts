import * as assert from "assert";
import * as vscode from "vscode";

import * as vscodeTreeSitter from "../../extension";

import { afterEach, beforeEach } from "mocha";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

suite("Installer Test Suite", function () {
    this.timeout(process.env.INSTALLER_TIMEOUT ?? 10 * 60 * 1000);
    let tempParsersDir: string | undefined = undefined;

    beforeEach(async () => {
        tempParsersDir = await mkdtemp(join(tmpdir(), "vscode-tree-sitter-download-test-"));
    });

    afterEach(async () => {
        if (tempParsersDir !== undefined) {
            await rm(tempParsersDir, { recursive: true, force: true });
        }
    });

    test("Parsers compatibility", async () => {
        const parsers: [string, [string | undefined, string] | undefined][] = [
            ["tree-sitter-bash", undefined],
            ["tree-sitter-c", undefined],
            ["tree-sitter-c-sharp", [undefined, "tree-sitter-c_sharp"]],
            ["tree-sitter-cpp", undefined],
            ["tree-sitter-go", undefined],
            // ["tree-sitter-haskell", undefined], // error in library
            ["tree-sitter-html", undefined],
            ["tree-sitter-java", undefined],
            ["tree-sitter-javascript", undefined],
            ["tree-sitter-julia", undefined],
            ["tree-sitter-python", undefined],
            ["tree-sitter-rust", undefined],
            ["tree-sitter-typescript", ["tsx", "tree-sitter-tsx"]],
            ["tree-sitter-typescript", ["typescript", "tree-sitter-typescript"]],
        ];

        await Promise.all(
            parsers.map(async ([npmPackageName, args]) => {
                if (tempParsersDir === undefined) {
                    throw new Error("temp dir was not assigned");
                }

                const subdirectory = args?.[0];
                const parserName = args?.[1];

                let number = 0;
                const downloaded = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        cancellable: false,
                        title: `Installing ${npmPackageName}`,
                    },
                    async (progress) => {
                        if (tempParsersDir === undefined) {
                            throw new Error("temp dir was not assigned");
                        }
                        return await vscodeTreeSitter.Installer.downloadParser(
                            tempParsersDir,
                            npmPackageName,
                            subdirectory,
                            (data) => progress.report({ message: data, increment: number++ })
                        );
                    }
                );

                assert.ok(downloaded, `failed to download ${parserName ?? npmPackageName}`);

                const parser = new vscodeTreeSitter.Parser();
                const language = await vscodeTreeSitter.Installer.loadParser(
                    tempParsersDir,
                    npmPackageName,
                    parserName
                );

                assert.ok(language, `failed to load ${parserName ?? npmPackageName}`);
                assert.doesNotThrow(
                    () => parser.setLanguage(language),
                    `failed to setLanguage ${parserName ?? npmPackageName}`
                );
            })
        );
    });
});
