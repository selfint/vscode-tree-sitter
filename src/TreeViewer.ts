import * as Installer from "./Installer";
import * as vscode from "vscode";
import { existsSync, rmSync } from "node:fs";
import Parser = require("tree-sitter");
import { FileTree } from "./FileTree";

export { Parser, FileTree, Installer };

async function getLanguage(
    parsersDir: string,
    languageId: string,
    languageIdOverrides?: Map<string, [string, string | undefined]>
): Promise<object | undefined> {
    const [id, symbol] = languageIdOverrides?.get(languageId) ?? [languageId, undefined];

    const parserName = `tree-sitter-${id}`;
    const parserDir = Installer.getParserDir(parsersDir, parserName);

    const npmCommand = "npm";
    const electronRebuildCommand = "electron-rebuild";

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
            void vscode.window.showErrorMessage(`Failed to download parser for language ${languageId}`);
            rmSync(parserDir, { recursive: true, force: true });
            return undefined;
        }
    }

    const language = Installer.loadParser(parsersDir, parserName, symbol);
    if (language === undefined) {
        void vscode.window.showErrorMessage(`Failed to load parser for language ${languageId}`);
        return undefined;
    }

    return language;
}

export class TreeViewer implements vscode.TextDocumentContentProvider {
    readonly uri = vscode.Uri.parse("vscode-tree-sitter://syntaxtree/tree.clj");
    readonly eventEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange: vscode.Event<vscode.Uri> | undefined = this.eventEmitter.event;

    private fileTree: FileTree | undefined;
    private parsersDir: string;
    private languageIdOverrides: Map<string, [string, string | undefined]> | undefined;

    constructor(parsersDir: string, languageIdOverrides?: Map<string, [string, string | undefined]>) {
        this.parsersDir = parsersDir;
        this.languageIdOverrides = languageIdOverrides;
    }

    public async viewFileTree(document: vscode.TextDocument): Promise<void> {
        const language = await getLanguage(this.parsersDir, document.languageId, this.languageIdOverrides);
        if (language === undefined) {
            return;
        }

        this.fileTree = FileTree.openFile(language, document.getText());
        this.eventEmitter.fire(this.uri);
    }

    private disposables: vscode.Disposable[] = [
        vscode.workspace.onDidOpenTextDocument(async (event: vscode.TextDocument) => {
            if (
                // The event is emitted before the document is updated in the active text editor
                // this guard ensures we only run when the active text editor document
                // had its language id changed
                event.uri === vscode.window.activeTextEditor?.document.uri &&
                // ignore our editor
                event.uri.toString() !== this.uri.toString()
            ) {
                await this.viewFileTree(event);
            }
        }),
        vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
            if (
                event.document.uri === vscode.window.activeTextEditor?.document.uri &&
                this.fileTree !== undefined
            ) {
                this.fileTree.update(event);
                this.eventEmitter.fire(this.uri);
            }
        }),
        vscode.window.onDidChangeActiveTextEditor(async (event: vscode.TextEditor | undefined) => {
            if (
                event?.document !== undefined &&
                // ignore our editor
                event.document.uri.toString() !== this.uri.toString()
            ) {
                await this.viewFileTree(event.document);
            }
        }),
        vscode.window.onDidChangeVisibleTextEditors((editors) => {
            if (!editors.some((e) => e.document.uri.toString() === this.uri.toString())) {
                this.disposables.map((d) => {
                    d.dispose();
                });
            }
        }),
    ];

    provideTextDocumentContent(_uri: vscode.Uri, _ct: vscode.CancellationToken): string {
        return this.fileTree?.tree.rootNode.toString().replace(/ \(/g, "\n(") ?? "Syntax tree not available";
    }
}
