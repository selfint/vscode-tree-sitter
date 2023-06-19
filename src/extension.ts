import * as Installer from "./Installer";
import * as vscode from "vscode";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import Parser = require("tree-sitter");
import { FileTree } from "./FileTree";

export { Parser, FileTree, Installer };

async function getLanguage(parsersDir: string, languageId: string): Promise<object | undefined> {
    const parserName = `tree-sitter-${languageId}`;
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
            rmSync(parserDir, { recursive: true, force: true });
            return undefined;
        }
    }

    const language = Installer.loadParser(parsersDir, parserName);
    if (language === undefined) {
        void vscode.window.showErrorMessage(`Failed to load parser for language ${languageId}`);
        return undefined;
    }

    return language;
}

export function activate(context: vscode.ExtensionContext): void {
    const parsersDir = resolve(join(context.extensionPath, "parsers"));
    let opened = false;

    if (!existsSync(parsersDir)) {
        mkdirSync(parsersDir, { recursive: true });
    }

    context.subscriptions.push(
        vscode.commands.registerCommand("vscode-tree-sitter.test", async () => {
            if (opened) {
                return;
            }
            opened = true;

            const editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
                return;
            }

            const language = await getLanguage(parsersDir, editor.document.languageId);
            if (language === undefined) {
                return;
            }

            const tdcp = new (class implements vscode.TextDocumentContentProvider {
                readonly uri = vscode.Uri.parse("vscode-tree-sitter://syntaxtree/tree.clj");
                readonly eventEmitter = new vscode.EventEmitter<vscode.Uri>();
                onDidChange: vscode.Event<vscode.Uri> | undefined = this.eventEmitter.event;

                private editorUri: vscode.Uri;
                private languageId: string;
                private fileTree: FileTree | undefined;

                private disposables: vscode.Disposable[] = [
                    vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
                        console.log("a");
                        if (event.document.uri === this.editorUri && this.fileTree !== undefined) {
                            this.fileTree.update(event);
                            this.eventEmitter.fire(this.uri);
                        }
                    }),
                    vscode.window.onDidChangeActiveTextEditor(
                        async (event: vscode.TextEditor | undefined) => {
                            if (
                                event?.document.uri === this.editorUri ||
                                // ignore our editor
                                event?.document.uri.toString() === this.uri.toString() ||
                                event?.document === undefined
                            ) {
                                return;
                            }

                            const newLanguage =
                                event.document.languageId === this.languageId
                                    ? (this.fileTree?.parser.getLanguage() as object)
                                    : await getLanguage(parsersDir, event.document.languageId);

                            if (newLanguage === undefined) {
                                return;
                            }

                            this.languageId = event.document.languageId;
                            this.editorUri = event.document.uri;
                            this.fileTree = FileTree.openFile(newLanguage, event.document.getText());

                            this.eventEmitter.fire(this.uri);
                        }
                    ),
                    vscode.window.onDidChangeVisibleTextEditors((editors) => {
                        if (!editors.some((e) => e.document.uri.toString() === this.uri.toString())) {
                            this.disposables.map((d) => {
                                d.dispose();
                            });
                            opened = false;
                        }
                    }),
                ];

                constructor(document: vscode.TextDocument, language: object) {
                    this.editorUri = document.uri;
                    this.languageId = document.languageId;
                    this.fileTree = FileTree.openFile(language, document.getText());
                }

                provideTextDocumentContent(_uri: vscode.Uri, _ct: vscode.CancellationToken): string {
                    return (
                        this.fileTree?.tree.rootNode.toString().replace(/ \(/g, "\n(") ??
                        "Syntax tree not available"
                    );
                }
            })(editor.document, language);

            context.subscriptions.push(
                vscode.workspace.registerTextDocumentContentProvider("vscode-tree-sitter", tdcp)
            );

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(tdcp.uri), {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true,
                preview: true,
            });
        })
    );
}

export function deactivate(): void {
    //
}
