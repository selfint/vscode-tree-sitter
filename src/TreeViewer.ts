import * as vscode from "vscode";
import { FileTree } from "./FileTree";
import { getLanguage } from "./extension";

export class TreeViewer implements vscode.TextDocumentContentProvider {
    readonly uri = vscode.Uri.parse("vscode-tree-sitter://syntaxtree/tree.clj");
    readonly eventEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange: vscode.Event<vscode.Uri> | undefined = this.eventEmitter.event;

    private fileTree: FileTree | undefined;
    private parsersDir: string;

    constructor(parsersDir: string) {
        this.parsersDir = parsersDir;
    }

    public async viewFileTree(document: vscode.TextDocument): Promise<void> {
        const language = await getLanguage(this.parsersDir, document.languageId);
        if (language === undefined) {
            return;
        }

        this.fileTree = await FileTree.new(language, document.getText());
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
