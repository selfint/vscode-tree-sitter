import * as Installer from "./Installer";
import * as vscode from "vscode";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import Parser = require("web-tree-sitter");
import { FileTree } from "./FileTree";
import { TreeViewer } from "./TreeViewer";

export { Parser, FileTree, Installer };

export function activate(context: vscode.ExtensionContext): void {
    const parsersDir = resolve(join(context.extensionPath, "parsers"));

    if (!existsSync(parsersDir)) {
        mkdirSync(parsersDir, { recursive: true });
    }

    const treeViewer = new TreeViewer(
        parsersDir,
        new Map([
            ["typescriptreact", ["tree-sitter-typescript", ["tsx", "tree-sitter-tsx"]]],
            ["typescript", ["tree-sitter-typescript", ["typescript", "tree-sitter-typescript"]]],
            ["javascriptreact", ["tree-sitter-javascript", undefined]],
        ])
    );

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider("vscode-tree-sitter", treeViewer)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("vscode-tree-sitter.test", async () => {
            // only open file manually when we open the tree view editor
            const openedDocuments = vscode.workspace.textDocuments;
            const openManually = !openedDocuments.some((e) => e.uri.toString() === treeViewer.uri.toString());

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(treeViewer.uri), {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true,
                preview: true,
            });

            if (openManually && vscode.window.activeTextEditor !== undefined) {
                await treeViewer.viewFileTree(vscode.window.activeTextEditor.document);
            }
        })
    );
}

export function deactivate(): void {
    //
}
