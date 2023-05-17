import jsonToAstParse from "json-to-ast";
import type { MarkerSeverity } from "monaco-editor";
import type { editor } from "monaco-editor";
import { ParsePath, ZodError } from "zod";

import { indent } from "./utils";

const equalPath = (p1: ParsePath, p2: ParsePath) => {
  return p1.join(".") === p2.join(".");
};

const isDirectChild = (p1: ParsePath, p2: ParsePath) => {
  return p1.join(".").startsWith(p2.join(".")) && p1.length === p2.length + 1;
};

export const mapZodErrorToMarkersForJsonAst = (
  ast: jsonToAstParse.ValueNode,
  error: ZodError<any>,
): editor.IMarkerData[] => {
  const markers: editor.IMarkerData[] = [];
  const currentPath: ParsePath = [];

  function collectError(node: jsonToAstParse.ValueNode) {
    const currentError = error.issues.find((issue) =>
      equalPath(issue.path, currentPath),
    );

    if (currentError) {
      markers.push({
        startLineNumber: node.loc!.start.line,
        startColumn: node.loc!.start.column,
        endLineNumber: node.loc!.end.line,
        endColumn: node.loc!.end.column,
        message: currentError.message,
        severity: 8 as MarkerSeverity,
      });
    }

    switch (node.type) {
      case "Object":
        for (const child of node.children) {
          currentPath.push(child.key.value);
          collectError(child.value);
          currentPath.pop();
        }

        const detachedChildrenErrors = error.issues.filter(
          (issue) =>
            isDirectChild(issue.path, currentPath) &&
            !node.children.find((c) => c.key.value === issue.path.at(-1)),
        );

        if (detachedChildrenErrors.length) {
          markers.push({
            startLineNumber: node.loc!.start.line,
            startColumn: node.loc!.start.column,
            endLineNumber: node.loc!.end.line,
            endColumn: node.loc!.end.column,
            message: indent([
              "The object has the following error(s): ",
              detachedChildrenErrors
                .map((e) => `  ${e.path.at(-1)}: ${e.message}`)
                .join("\n"),
            ]),
            severity: 8 as MarkerSeverity,
          });
        }

        break;
      case "Array":
        let index = 0;
        for (const child of node.children) {
          currentPath.push(index);
          collectError(child);
          currentPath.pop();
          index++;
        }

        break;
      case "Literal":
        break;
    }
  }

  collectError(ast);

  return markers;
};
