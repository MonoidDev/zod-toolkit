import React, { useCallback, useMemo } from "react";

import Editor, { BeforeMount } from "@monaco-editor/react";
import jsonToAstParse from "json-to-ast";
import prettierBabel from "prettier/parser-babel";
import prettier from "prettier/standalone";
import { Schema, ZodError } from "zod";

import { mapZodErrorToMarkersForJsonAst } from "./mapZodErrorToMarkersForJsonAst";

export interface ZodMonacoReporterProps {
  value: unknown;
  error?: ZodError;
  schema?: Schema;
  name?: string;
}

const markerOwner = "zod";

export function ZodMonacoReporter(props: ZodMonacoReporterProps) {
  const { value, error, schema, name } = props;

  const editorPath = useMemo(() => {
    if (name) return name;

    return `${Math.random()}.json`;
  }, []);

  const formatted = useMemo(
    () =>
      prettier.format(JSON.stringify(value), {
        parser: "json",
        plugins: [prettierBabel],
      }),
    [value],
  );

  const finalError = useMemo(() => {
    if (error) {
      return error;
    }
    const r = schema?.safeParse(value);
    if (r?.success) {
      return undefined;
    }
    return r?.error;
  }, [value, error, schema]);

  const beforeMount: BeforeMount = useCallback(
    (monaco) => {
      if (!finalError) return;

      const formattedAst = jsonToAstParse(formatted);

      const model = monaco.editor.createModel(
        formatted,
        "json",
        monaco.Uri.parse(editorPath),
      );

      monaco.editor.setModelMarkers(
        model,
        markerOwner,
        mapZodErrorToMarkersForJsonAst(formattedAst, finalError),
      );
    },
    [finalError],
  );

  return (
    <Editor
      defaultLanguage="json"
      defaultValue={formatted}
      value={formatted}
      beforeMount={beforeMount}
      path={editorPath}
      options={{
        readOnly: true,
        renderValidationDecorations: "on",
      }}
    />
  );
}
