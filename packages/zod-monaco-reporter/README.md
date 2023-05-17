# Zod Monaco Editor

Render Zod errors in Monaco Editor (the editor used by VSCode).

## Installation

```bash
npm install @monoid-dev/zod-monaco-reporter
pnpm install @monoid-dev/zod-monaco-reporter
yarn add @monoid-dev/zod-monaco-reporter
```

## Get Started

Consider the following Zod schema:

```ts
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
})
```

Render the validation result with React

```tsx
import { ZodMonacoReporter } from '@monoid-dev/zod-monaco-reporter'

function App() {
  return (
    <ZodMonacoReporter
      value={{
        count: 3,
        results: [
          { id: 1, age: 25, type: "a" },
          { id: 2, age: 30, type: "b" },
          { id: 3, age: 35, type: "d" },
          { id: 4, age: "40", type: "c" },
          { id: 5 },
        ],
        noemptyArray: [],
        primitive: {
          aa: 114514,
        },
      }}
      schema={schema}
    />
  );
}
```

Get the nice report of whatever errors in your data!

![preview](https://raw.githubusercontent.com/MonoidDev/zod-endec/master/packages/zod-monaco-reporter/docs/preview.jpg)

See it live on CodeSandbox: TODO

## Reference

### ZodMonacoReporter

Usage:

```ts
<ZodMonacoReporter value={value} schema={schema} name="filename.json" />
```

Parameters:

1. value: Any value needs validation. Notice that currently the value needs to be JSON serializable or it cannot be displayed correctly.
2. schema: The zod schema used to verify the `value`.
3. name?: Optional. The name of the data. It needs to be unique for the Monaco Editor the match each `value` to its own `Model`. If you don't provide one, we generate a random name for you.

