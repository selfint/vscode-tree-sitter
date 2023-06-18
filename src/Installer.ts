import * as path from "path";
import { ExecException, ExecOptions, exec } from "child_process";

const TREE_SITTER_VERSION = "0.20.1";
const ELECTRON_VERSION = "22.0.0";

export function getParserDir(parsersDir: string, parserName: string): string {
    // add '-module' to parser name, since if node module == prefix string
    // weird behavior happens
    return path.resolve(path.join(parsersDir, `${parserName}-module`));
}

function getNodeBindingsPath(parsersDir: string, parserName: string): string {
    // this path assumes the library has been installed via npm install --prefix, not just cloned with git
    return path.resolve(
        path.join(getParserDir(parsersDir, parserName), "node_modules", parserName, "bindings", "node")
    );
}

export async function loadParser(
    parsersDir: string,
    parserName: string,
    symbol: string | undefined = undefined
): Promise<object | undefined> {
    const nodeBindingsPath = getNodeBindingsPath(parsersDir, parserName);

    if (symbol === undefined) {
        return (await import(nodeBindingsPath)) as object;
    } else {
        const lib = (await import(nodeBindingsPath)) as Record<string, object>;
        return lib[symbol];
    }
}

export async function downloadParser(
    parsersDir: string,
    parserName: string,
    onData?: (data: string) => void,
    npmCommand = "npm",
    electronRebuildCommand = "electron-rebuild"
): Promise<boolean> {
    const parserDir = getParserDir(parsersDir, parserName);
    const installCmd = `${npmCommand} install --prefix ${parserDir} ${parserName}@"<=${TREE_SITTER_VERSION}"`;
    const installOptions = { cwd: parsersDir };

    const installErr = await runCmd(installCmd, installOptions, onData);

    if (installErr !== undefined) {
        console.log("Failed to install, err:");
        console.log(installErr);
        return false;
    }

    const rebuildCmd = `${electronRebuildCommand} -v ${ELECTRON_VERSION}`;
    const rebuildOptions = { cwd: parserDir };

    const rebuildErr = await runCmd(rebuildCmd, rebuildOptions, onData);
    if (rebuildErr !== undefined) {
        console.log("Failed to rebuild, err:");
        console.log(rebuildErr);
        return false;
    }

    return true;
}

async function runCmd(
    cmd: string,
    options: ExecOptions,
    onData?: (data: string) => void
): Promise<ExecException | undefined> {
    const err = await new Promise<ExecException | null>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const proc = exec(cmd, options, (err, _stdout, _stderr) => {
            if (err !== null) {
                resolve(err);
            } else {
                resolve(null);
            }
        });

        if (onData !== undefined) {
            proc.stdout?.on("data", onData);
            proc.stderr?.on("data", onData);
        }
    });

    return err ?? undefined;
}
