import Parser = require("tree-sitter");
// @ts-expect-error ignore missing types
import Javascript = require("tree-sitter-javascript");

function main(): void {
    const p = new Parser();
    p.setLanguage(Javascript);

    const tree = p.parse("function main() {}");

    console.log("@".repeat(100));
    console.log(tree.rootNode);
    console.log(tree.rootNode);
    console.log("@".repeat(100));
}

main();
