export type Indent = string | Indent[];

export const indent = (lines: Indent[]) => {
  let text = "";

  let level = -1;

  function collectLines(indent: Indent) {
    if (typeof indent === "string") {
      text += "  ".repeat(level) + indent + "\n";
    } else {
      level += 1;
      for (const line of indent) {
        collectLines(line);
      }
      level -= 1;
    }
  }

  collectLines(lines);

  return text;
};
