/**
 * AST Builder — ts-morph based TypeScript/TSX code generation.
 *
 * Replaces string concatenation with structurally guaranteed output:
 * - Imports are auto-managed (no duplicates, correct paths)
 * - Component structure is type-safe
 * - Output is auto-formatted via ts-morph's formatting
 */

import {
  Project,
  StructureKind,
  VariableDeclarationKind,
  type SourceFile,
} from "ts-morph";

// ── Project factory ────────────────────────────────────────────────────────

/** Create a fresh in-memory ts-morph project */
export function createProject(): Project {
  return new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsx: 2,
      target: 7,
      module: 99,
      esModuleInterop: true,
      strict: true,
    },
  });
}

// ── Import management ──────────────────────────────────────────────────────

export interface ImportSpec {
  named?: string[];
  default?: string;
  modulePath: string;
  typeOnly?: boolean;
}

/** Add imports to a SourceFile, deduplicating by module path */
export function addImports(sourceFile: SourceFile, imports: ImportSpec[]): void {
  const seen = new Map<string, { named: Set<string>; default: string | null; typeOnly: boolean }>();

  for (const imp of imports) {
    const entry = seen.get(imp.modulePath);
    if (entry) {
      if (imp.named) for (const n of imp.named) entry.named.add(n);
      if (imp.default) entry.default = imp.default;
    } else {
      seen.set(imp.modulePath, {
        named: new Set(imp.named ?? []),
        default: imp.default ?? null,
        typeOnly: imp.typeOnly ?? false,
      });
    }
  }

  for (const [modulePath, info] of seen) {
    const decl = sourceFile.addImportDeclaration({
      moduleSpecifier: modulePath,
      isTypeOnly: info.typeOnly,
    });
    if (info.default) decl.setDefaultImport(info.default);
    if (info.named.size > 0) {
      decl.addNamedImports([...info.named].map((n) => ({ name: n })));
    }
  }
}

// ── Component generation ───────────────────────────────────────────────────

export interface StepRender {
  index: number;
  jsx: string;
}

export interface ComponentSpec {
  name: string;
  propsType: string;
  paramName: string;
  steps: StepRender[];
  imports?: ImportSpec[];
}

/**
 * Generate a React chapter component source file.
 * Produces: if/else if chain with one JSX return per step.
 */
export function buildChapterComponent(
  project: Project,
  spec: ComponentSpec
): SourceFile {
  const sourceFile = project.createSourceFile(`${spec.name}.tsx`);

  // Add user-specified imports
  if (spec.imports) {
    addImports(sourceFile, spec.imports);
  }

  // Add type import for props
  sourceFile.addImportDeclaration({
    moduleSpecifier: "../../registry/types",
    isTypeOnly: true,
    namedImports: [{ name: spec.propsType }],
  });

  // Add CSS import
  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${spec.name}.css`,
  });

  // Build if/else chain as text and inject into function body
  let writer = "";
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i]!;
    const keyword = i === 0 ? "if" : "else if";
    writer += `  ${keyword} (${spec.paramName} === ${step.index}) {\n`;
    writer += `    return (\n`;
    const jsxLines = step.jsx.trim().split("\n");
    for (const line of jsxLines) {
      if (line.length > 0) writer += `      ${line}\n`;
      else writer += "\n";
    }
    writer += `    );\n`;
    writer += `  }\n\n`;
  }
  writer += `  return null;\n`;

  // Build the component function with the body as text
  sourceFile.addFunction({
    name: spec.name,
    isDefaultExport: true,
    parameters: [{
      name: `{ ${spec.paramName} }`,
      type: spec.propsType,
      kind: StructureKind.Parameter,
    }],
    returnType: "React.JSX.Element | null",
    statements: writer,
  });

  return sourceFile;
}

// ── Narrations file ────────────────────────────────────────────────────────

export function buildNarrationsFile(
  project: Project,
  _componentName: string,
  narrations: string[]
): SourceFile {
  const sourceFile = project.createSourceFile("narrations.ts");

  sourceFile.addImportDeclaration({
    moduleSpecifier: "../../registry/types",
    isTypeOnly: true,
    namedImports: [{ name: "Narration" }],
  });

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [{
      name: "narrations",
      type: "Narration[]",
      initializer: `[\n  ${narrations.map((n) => JSON.stringify(n)).join(",\n  ")}\n]`,
    }],
  });

  return sourceFile;
}

// ── Registry entries ───────────────────────────────────────────────────────

export function buildRegistryImports(
  project: Project,
  chapters: Array<{ chapterId: string; componentName: string }>
): SourceFile {
  const sourceFile = project.createSourceFile("chapters.ts");

  for (const ch of chapters) {
    sourceFile.addImportDeclaration({
      defaultImport: ch.componentName,
      moduleSpecifier: `../chapters/${ch.chapterId}/${ch.componentName}`,
    });
    sourceFile.addImportDeclaration({
      namedImports: [{ name: `narrations as ${ch.chapterId.replace(/-/g, "")}Narrations` }],
      moduleSpecifier: `../chapters/${ch.chapterId}/narrations`,
    });
  }

  sourceFile.addImportDeclaration({
    moduleSpecifier: "./types",
    isTypeOnly: true,
    namedImports: [{ name: "ChapterDef" }],
  });

  const entries = chapters.map((ch) => {
    const varName = ch.chapterId.replace(/-/g, "");
    return `  { id: "${ch.chapterId}", title: "${ch.chapterId}", narrations: ${varName}Narrations, Component: ${ch.componentName} }`;
  });

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [{
      name: "CHAPTERS",
      type: "ChapterDef[]",
      initializer: `[\n${entries.join(",\n")}\n]`,
    }],
  });

  return sourceFile;
}

// ── CSS builder ────────────────────────────────────────────────────────────

export function buildChapterCSS(chapterId: string, title: string, cssBlocks: string[]): string {
  const header = [
    `/* ─────────────────────────────────────────────────────────────────────`,
    ` * ${title}`,
    ` * Auto-generated from chapter blueprint. Edit the blueprint, not this file.`,
    ` * ───────────────────────────────────────────────────────────────────── */`,
    "",
    `.ch-${chapterId} { color: var(--text); }`,
    "",
  ];

  const blocks = [...new Set(cssBlocks)].filter(Boolean);
  return [...header, ...blocks.map((b) => b + "\n")].join("\n");
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function formatSourceFile(sourceFile: SourceFile): string {
  sourceFile.formatText({
    indentSize: 2,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
  });
  return sourceFile.getFullText();
}

export function formatJsx(jsx: string): string {
  return jsx.split("\n").map((l) => l.trimEnd()).join("\n");
}
