import Parser = require("tree-sitter");
import { Tree } from "tree-sitter";

export class FileTree {
    private parser: Parser;
    public tree: Tree;

    private constructor(parser: Parser, text: string) {
        this.parser = parser;
        this.tree = parser.parse(text);
    }

    /**
     * Get a FileBlocks object for a given file
     * @param language file language, needs to be a tree-sitter language object
     * @param text file text
     * @returns FileBlocks object
     */
    public static openFile<T>(
        language: T extends Promise<unknown> ? never : T extends undefined ? never : T,
        text: string
    ): FileTree {
        const parser = new Parser();
        parser.setLanguage(language);

        return new FileTree(parser, text);
    }

    public update(text: string): void {
        this.tree = this.parser.parse(text, this.tree);
    }
}
