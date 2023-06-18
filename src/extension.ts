import * as Installer from "./Installer";
import * as vscode from "vscode";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import Parser = require("tree-sitter");
import { FileTree } from "./FileTree";

export { Parser, FileTree, Installer };

export function activate(context: vscode.ExtensionContext): void {
    const parsersDir = resolve(join(context.extensionPath, "parsers"));

    const npmCommand = "npm";
    const electronRebuildCommand = resolve(
        join(context.extensionPath, "node_modules", ".bin", "electron-rebuild")
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("vscode-tree-sitter.test", async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
                return;
            }

            if (!existsSync(parsersDir)) {
                mkdirSync(parsersDir, { recursive: true });
            }

            const text = editor.document.getText();
            const languageId = editor.document.languageId;

            const parserName = `tree-sitter-${languageId}`;
            const parserDir = Installer.getParserDir(parsersDir, parserName);

            if (!existsSync(parserDir)) {
                let number = 0;
                const downloaded = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        cancellable: false,
                        title: `Installing ${parserName}`,
                    },
                    async (progress) => {
                        return await Installer.downloadParser(
                            parsersDir,
                            parserName,
                            (data) => progress.report({ message: data, increment: number++ }),
                            npmCommand,
                            electronRebuildCommand
                        );
                    }
                );

                if (!downloaded) {
                    rmSync(parserDir, { recursive: true, force: true });
                    return;
                }
            }

            const language = await Installer.loadParser(parsersDir, parserName);
            if (language === undefined) {
                void vscode.window.showErrorMessage(`Failed to load parser for language ${languageId}`);
                return;
            }

            const fileTree = FileTree.openFile(language, text);
            await vscode.window.showInformationMessage(fileTree.tree.rootNode.toString());
        })
    );
}

export function deactivate(): void {
    //
}
