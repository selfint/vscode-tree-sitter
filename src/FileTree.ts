import * as vscode from "vscode";

import Parser = require("tree-sitter");
import { Tree } from "tree-sitter";

const positionToPoint = (pos: vscode.Position): Parser.Point => {
    return {
        row: pos.line,
        column: pos.character,
    };
};

export class FileTree {
    public parser: Parser;
    public tree: Tree;

    private constructor(parser: Parser, text: string) {
        this.parser = parser;
        this.tree = parser.parse(text);
    }

    /**
     * Get a FileTree object for a given file
     * @param language file language, needs to be a tree-sitter language object
     * @param text file text
     * @returns FileTree object
     */
    public static openFile<T>(language: T extends undefined ? never : T, text: string): FileTree {
        const parser = new Parser();
        parser.setLanguage(language);

        return new FileTree(parser, text);
    }

    public update(event: vscode.TextDocumentChangeEvent): void {
        for (const change of event.contentChanges) {
            const startIndex = change.rangeOffset;
            const oldEndIndex = change.rangeOffset + change.rangeLength;
            const newEndIndex = change.rangeOffset + change.text.length;

            const startPosition = change.range.start;
            const oldEndPosition = change.range.end;
            const newEndPosition = event.document.positionAt(newEndIndex);

            this.tree.edit({
                startIndex: startIndex,
                oldEndIndex: oldEndIndex,
                newEndIndex: newEndIndex,
                startPosition: positionToPoint(startPosition),
                oldEndPosition: positionToPoint(oldEndPosition),
                newEndPosition: positionToPoint(newEndPosition),
            } as Parser.Edit);
        }

        this.tree = this.parser.parse(event.document.getText(), this.tree);
    }
}
