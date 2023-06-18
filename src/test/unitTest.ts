import Parser = require("tree-sitter");
// @ts-expect-error ignore missing types
import Rust = require("tree-sitter-rust");

function main(): void {
    const p = new Parser();
    p.setLanguage(Rust);

    const tree = p.parse("fn main() {}");

    console.log("@".repeat(100));
    console.log(tree.rootNode);
    console.log(tree.rootNode);
    console.log("@".repeat(100));
}

main();