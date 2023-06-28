import * as Installer from "./Installer";
import * as vscode from "vscode";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import Parser = require("web-tree-sitter");
import { FileTree } from "./FileTree";
import { Language } from "web-tree-sitter";
import { TreeViewer } from "./TreeViewer";

export { Parser, FileTree, Installer };

export const parserFinishedInit = new Promise<void>((resolve) => {
    void Parser.init().then(() => {
        resolve();
    });
});

type LanguageIdOverride = {
    npmPackageName: string;
    parserName: string;
    subdirectory?: string;
};
function getLanguageIdOverride(languageId: string): LanguageIdOverride {
    const getLangIdConfig = (c: string): string | undefined =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        vscode.workspace.getConfiguration(`[${languageId}]`)[`vscode-tree-sitter.${c}`] ?? undefined;

    const npmPackageName = getLangIdConfig("npmPackageName") ?? `tree-sitter-${languageId}`;
    const parserName = getLangIdConfig("parserName") ?? npmPackageName;
    const subdirectory = getLangIdConfig("subdirectory");

    return {
        npmPackageName,
        parserName,
        subdirectory,
    };
}

function getIgnoredLanguageIds(): string[] {
    return (
        vscode.workspace
            .getConfiguration("vscode-tree-sitter")
            .get<string[] | undefined | null>("ignoredLanguageIds") ?? []
    );
}

export async function getLanguage(parsersDir: string, languageId: string): Promise<Language | undefined> {
    const ignoredLanguageIds = getIgnoredLanguageIds();
    if (ignoredLanguageIds.includes(languageId)) {
        return undefined;
    }

    await parserFinishedInit;

    const { npmPackageName, subdirectory, parserName } = getLanguageIdOverride(languageId);
    const parserWasmBindings = Installer.getWasmBindingsPath(parsersDir, npmPackageName, parserName);

    const npmCommand = "npm";
    const treeSitterCli = "tree-sitter";

    if (!existsSync(parserWasmBindings)) {
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
                    npmPackageName,
                    subdirectory,
                    (data) => progress.report({ message: data, increment: number++ }),
                    npmCommand,
                    treeSitterCli
                );
            }
        );

        if (!downloaded) {
            void vscode.window.showErrorMessage(`Failed to download parser for language ${languageId}`);
            return undefined;
        }
    }

    const language = await Installer.loadParser(parsersDir, npmPackageName, parserName);
    if (language === undefined) {
        void vscode.window.showErrorMessage(`Failed to load parser for language ${languageId}`);
        return undefined;
    }

    return language;
}

export function activate(context: vscode.ExtensionContext): void {
    const parsersDir = resolve(join(context.extensionPath, "parsers"));

    if (!existsSync(parsersDir)) {
        mkdirSync(parsersDir, { recursive: true });
    }

    const treeViewer = new TreeViewer(parsersDir);

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
