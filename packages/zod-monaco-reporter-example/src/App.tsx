import { useState } from "react";
import React from "react";

import { z } from "zod";

const LazyZodMonacoReporter = React.lazy(
  () => import("@monoid-dev/zod-monaco-reporter"),
);

const schema = z.object({
  count: z.number(),
  results: z
    .object({
      id: z.number(),
      age: z.number(),
      type: z.enum(["a", "b", "c"]),
    })
    .array(),
  noemptyArray: z.array(z.number()).nonempty(),
  primitive: z.number(),
});

function App() {
  const [editorId, setEditorId] = useState(0);

  const editors = [
    <LazyZodMonacoReporter
      value={{
        count: 3,
        results: [
          { id: 1, age: 25, type: "a" },
          { id: 2, age: 30, type: "b" },
          { id: 3, age: 35, type: "d" }, // 错误的值 "d"
          { id: 4, age: "40", type: "c" }, // 错误的值 "40",
          { id: 5 },
        ],
        noemptyArray: [],
        primitive: {
          aa: 114514,
        },
      }}
      schema={schema}
    />,

    <LazyZodMonacoReporter
      value={{
        count: 3,
        results: { id: 1, age: 25, type: "a" },
        noemptyArray: [],
        primitive: 1,
      }}
      schema={schema}
    />,
  ];

  return (
    <>
      <nav>
        {editors.map((_, i) => (
          <button onClick={() => setEditorId(i)} key={i}>{`file${i}`}</button>
        ))}
      </nav>
      <div style={{ flex: 1 }}>
        {editors.map((e, i) =>
          i === editorId ? React.cloneElement(e, { key: i }) : null,
        )}
      </div>
    </>
  );
}

export default App;
