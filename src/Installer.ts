import * as path from "path";
import * as tar from "tar";
import { ExecException, ExecOptions, exec } from "child_process";
import { Language } from "web-tree-sitter";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

export function getParserDir(parsersDir: string, npmPackageName: string): string {
    return path.resolve(path.join(parsersDir, npmPackageName));
}

function getWasmBindingsPath(parsersDir: string, npmPackageName: string, parserName?: string): string {
    // this path assumes the library was rebuilt from the parser dir
    return path.resolve(
        path.join(getParserDir(parsersDir, npmPackageName), `${parserName ?? npmPackageName}.wasm`)
    );
}

export async function loadParser(
    parsersDir: string,
    npmPackageName: string,
    parserName?: string
): Promise<Language | undefined> {
    const wasmPath = getWasmBindingsPath(parsersDir, npmPackageName, parserName);
    if (!existsSync(wasmPath)) {
        return undefined;
    } else {
        try {
            return await Language.load(wasmPath);
        } catch (error) {
            console.log(`Failed to load ${wasmPath}, due to error:`);
            console.log(error);
            return undefined;
        }
    }
}

export async function downloadParser(
    parsersDir: string,
    parserNpmPackage: string,
    subdirectory?: string,
    onData?: (data: string) => void,
    npm = "npm",
    treeSitterCli = "tree-sitter"
): Promise<boolean> {
    const parserDir = getParserDir(parsersDir, parserNpmPackage);
    await mkdir(parserDir, { recursive: true });

    const installResult = await runCmd(
        `${npm} pack --verbose --json --pack-destination ${parserDir} ${parserNpmPackage}`,
        {},
        onData
    );

    let tarFilename: string | undefined = undefined;
    switch (installResult.status) {
        case "err":
            console.log("Failed to install, err:");
            console.log(installResult.result);
            return false;

        case "ok":
            tarFilename = (JSON.parse(installResult.result) as { filename: string }[])[0].filename;
    }

    try {
        await tar.extract({
            file: path.resolve(path.join(parserDir, tarFilename)),
            cwd: parserDir,
            strip: 1,
            onentry: (entry) => onData?.(entry.path),
        });
    } catch (e: unknown) {
        onData?.(`failed to extract ${tarFilename} to ${parserDir}, due to err: ${JSON.stringify(e)}`);
        return false;
    }

    const buildResult = await runCmd(
        `${treeSitterCli} build-wasm ${subdirectory ?? ""}`,
        { cwd: parserDir },
        onData
    );
    switch (buildResult.status) {
        case "err":
            onData?.(`Failed to build .wasm parser, err: ${JSON.stringify(buildResult.result)}`);
            return false;

        case "ok":
            return true;
    }
}

type Result<T, E> = { status: "ok"; result: T } | { status: "err"; result: E };
async function runCmd(
    cmd: string,
    options: ExecOptions,
    onData?: (data: string) => void
): Promise<Result<string, ExecException>> {
    return await new Promise((resolve) => {
        const proc = exec(cmd, options, (err, stdout: string, _stderr) => {
            if (err !== null) {
                resolve({ status: "err", result: err });
            } else {
                resolve({ status: "ok", result: stdout });
            }
        });

        if (onData !== undefined) {
            proc.stdout?.on("data", onData);
            proc.stderr?.on("data", onData);
        }
    });
}
