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
        const parsers: [string, string[] | undefined][] = [
            ["tree-sitter-rust", undefined],
            ["tree-sitter-typescript", ["typescript", "tsx"]],
            ["tree-sitter-go", undefined],
            ["tree-sitter-python", undefined],
            ["tree-sitter-javascript", undefined],
            ["tree-sitter-html", undefined],
            ["tree-sitter-c", undefined],
            ["tree-sitter-cpp", undefined],
            ["tree-sitter-c-sharp", undefined],
            ["tree-sitter-bash", undefined],
            // ["tree-sitter-haskell", undefined],  // uses language version 14, we use 13
            ["tree-sitter-java", undefined],
            ["tree-sitter-julia", undefined],
        ];

        await Promise.all(
            parsers.map(async ([parserName, symbols]) => {
                if (tempParsersDir === undefined) {
                    throw new Error("temp dir was not assigned");
                }

                let number = 0;
                const downloaded = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        cancellable: false,
                        title: `Installing ${parserName}`,
                    },
                    async (progress) => {
                        if (tempParsersDir === undefined) {
                            throw new Error("temp dir was not assigned");
                        }
                        return await vscodeTreeSitter.Installer.downloadParser(
                            tempParsersDir,
                            parserName,
                            (data) => progress.report({ message: data, increment: number++ })
                        );
                    }
                );

                assert.ok(downloaded);

                const p = new vscodeTreeSitter.Parser();
                if (symbols === undefined) {
                    const language = vscodeTreeSitter.Installer.loadParser(tempParsersDir, parserName);
                    assert.doesNotThrow(() => p.setLanguage(language));
                } else {
                    if (symbols.length === 0) {
                        throw new Error("got 0 symbols");
                    }

                    for (const symbol of symbols) {
                        const language = vscodeTreeSitter.Installer.loadParser(
                            tempParsersDir,
                            parserName,
                            symbol
                        );

                        assert.doesNotThrow(() => p.setLanguage(language));
                    }
                }
            })
        );
    });
});
