#!/usr/bin/env bun
/**
 * Fails when a promise is started and dropped: a call used as a statement
 * whose result can be awaited but is not. The database is asynchronous, so a
 * query without `await` runs late or not at all, and nothing else says so.
 * Biome's own rule does not see through the query builder's types; this asks
 * the TypeScript compiler, which does. Write `void call()` to drop one on purpose.
 */
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const configFile = path.join(root, "tsconfig.json");
const config = ts.getParsedCommandLineOfConfigFile(
  configFile,
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    },
  },
);
if (!config) throw new Error(`Cannot read ${configFile}`);

const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const source = path.join(root, "src") + path.sep;

const awaitable = (type: ts.Type): boolean =>
  type.isUnion() ? type.types.some(awaitable) : type.getProperty("then") !== undefined;

/** `promise.catch(...)` deals with the failure, so it is not dropped. */
const handled = (call: ts.CallExpression) =>
  ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "catch";

const dropped: string[] = [];
function visit(node: ts.Node, file: ts.SourceFile) {
  if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
    const call = node.expression;
    if (!handled(call) && awaitable(checker.getTypeAtLocation(call))) {
      const { line, character } = file.getLineAndCharacterOfPosition(call.getStart(file));
      const text = call.getText(file).split("\n")[0].slice(0, 80);
      dropped.push(`${path.relative(root, file.fileName)}:${line + 1}:${character + 1}  ${text}`);
    }
  }
  ts.forEachChild(node, (child) => visit(child, file));
}

for (const file of program.getSourceFiles()) {
  if (file.fileName.startsWith(source)) visit(file, file);
}

if (dropped.length > 0) {
  console.error(`Promises started and not awaited (add "await", or "void" to drop on purpose):\n`);
  for (const line of dropped) console.error(`  ${line}`);
  process.exit(1);
}
console.log("Every promise is awaited.");
