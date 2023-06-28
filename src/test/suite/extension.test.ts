import * as assert from "assert";

import * as vscode from "vscode";

suite.only("vscode-tree-sitter", function () {
    suite(".test", function () {
        this.beforeAll(
            () => void vscode.window.showInformationMessage("Start vscode-tree-sitter.test tests")
        );

        test("Shows s-exp on the side without stealing focus", async function () {
            const text = "fn main() { }";
            const document = await vscode.workspace.openTextDocument({
                language: "rust",
                content: text,
            });

            await vscode.window.showTextDocument(document);

            const activeDocument = vscode.window.activeTextEditor?.document;

            assert.equal(activeDocument, document);
        });
    });
});
