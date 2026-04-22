import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

type Shape = {
  required: string[];
  properties: string[];
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function sorted(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function diff(expected: string[], actual: string[]): string[] {
  const actualSet = new Set(actual);
  return expected.filter((value) => !actualSet.has(value));
}

function readUtf8(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function propertyNameToString(
  sourceFile: ts.SourceFile,
  name: ts.PropertyName,
): string {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return name.getText(sourceFile);
}

function extractInterfaceShape(
  sourceFilePath: string,
  interfaceName: string,
): Shape {
  const sourceText = readUtf8(sourceFilePath);
  const sourceFile = ts.createSourceFile(
    sourceFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let found: ts.InterfaceDeclaration | undefined;

  const visit = (node: ts.Node): void => {
    if (
      ts.isInterfaceDeclaration(node) &&
      node.name.text === interfaceName
    ) {
      found = node;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!found) {
    throw new Error(`Interface not found: ${interfaceName}`);
  }

  const properties: string[] = [];
  const required: string[] = [];

  for (const member of found.members) {
    if (!ts.isPropertySignature(member) || !member.name) {
      continue;
    }

    const propertyName = propertyNameToString(sourceFile, member.name);
    properties.push(propertyName);

    if (!member.questionToken) {
      required.push(propertyName);
    }
  }

  return {
    properties: sorted(unique(properties)),
    required: sorted(unique(required)),
  };
}

function extractYamlSchemaShape(
  yamlText: string,
  schemaName: string,
): Shape {
  const lines = yamlText.split(/\r?\n/u);
  const startPattern = new RegExp(`^ {4}${schemaName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}:$`, "u");
  const schemaStartIndex = lines.findIndex((line) => startPattern.test(line));

  if (schemaStartIndex === -1) {
    throw new Error(`OpenAPI schema not found: ${schemaName}`);
  }

  const properties: string[] = [];
  const required: string[] = [];
  let mode: "idle" | "required" | "properties" = "idle";

  for (let index = schemaStartIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const indent = line.match(/^ */u)?.[0].length ?? 0;

    if (/^ {4}[A-Za-z0-9_@"-]+:$/u.test(line)) {
      break;
    }

    if (!trimmed) {
      continue;
    }

    if (indent === 6 && trimmed === "required:") {
      mode = "required";
      continue;
    }

    if (indent === 6 && trimmed === "properties:") {
      mode = "properties";
      continue;
    }

    if (mode === "required") {
      if (indent === 8 && trimmed.startsWith("- ")) {
        required.push(trimmed.slice(2).trim().replace(/^"|"$/gu, ""));
        continue;
      }

      if (indent <= 6) {
        mode = "idle";
      }
    }

    if (mode === "properties") {
      if (indent === 8 && /^["@A-Za-z0-9_-]+:$/u.test(trimmed)) {
        properties.push(trimmed.slice(0, -1).replace(/^"|"$/gu, ""));
        continue;
      }

      if (indent <= 6) {
        mode = "idle";
      }
    }
  }

  return {
    properties: sorted(unique(properties)),
    required: sorted(unique(required)),
  };
}

function extractJsonSchemaShape(
  jsonSchema: Record<string, unknown>,
): Shape {
  const propertiesObject = (jsonSchema.properties ?? {}) as Record<string, unknown>;
  const required = Array.isArray(jsonSchema.required)
    ? (jsonSchema.required as string[])
    : [];

  return {
    properties: sorted(Object.keys(propertiesObject)),
    required: sorted(unique(required)),
  };
}

function assertExactMatch(
  label: string,
  expected: string[],
  actual: string[],
  errors: string[],
): void {
  const missing = diff(expected, actual);
  const unexpected = diff(actual, expected);

  if (missing.length === 0 && unexpected.length === 0) {
    return;
  }

  if (missing.length > 0) {
    errors.push(`${label}: missing ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    errors.push(`${label}: unexpected ${unexpected.join(", ")}`);
  }
}

function assertContains(
  label: string,
  haystack: string,
  needle: string,
  errors: string[],
): void {
  if (!haystack.includes(needle)) {
    errors.push(`${label}: missing '${needle}'`);
  }
}

function main(): void {
  const repoRoot = process.cwd();
  const codeFile = path.resolve(repoRoot, "src", "application", "HomeGenomeControlPlane.ts");
  const openApiFile = path.resolve(
    repoRoot,
    "docs",
    "reference",
    "homegenome-control-plane.openapi.yaml",
  );
  const jsonSchemaFile = path.resolve(
    repoRoot,
    "docs",
    "reference",
    "schemas",
    "case-export-bundle.schema.json",
  );

  const openApiText = readUtf8(openApiFile);
  const jsonSchema = JSON.parse(readUtf8(jsonSchemaFile)) as Record<string, unknown>;
  const errors: string[] = [];

  const caseExportBundleTs = extractInterfaceShape(codeFile, "CaseExportBundle");
  const caseExportBundleYaml = extractYamlSchemaShape(openApiText, "CaseExportBundle");
  const caseExportBundleJson = extractJsonSchemaShape(jsonSchema);

  assertExactMatch(
    "CaseExportBundle properties vs OpenAPI",
    caseExportBundleTs.properties,
    caseExportBundleYaml.properties,
    errors,
  );
  assertExactMatch(
    "CaseExportBundle required vs OpenAPI",
    caseExportBundleTs.required,
    caseExportBundleYaml.required,
    errors,
  );
  assertExactMatch(
    "CaseExportBundle properties vs JSON Schema",
    caseExportBundleTs.properties,
    caseExportBundleJson.properties,
    errors,
  );
  assertExactMatch(
    "CaseExportBundle required vs JSON Schema",
    caseExportBundleTs.required,
    caseExportBundleJson.required,
    errors,
  );

  const drsTs = extractInterfaceShape(codeFile, "CaseBundleDrsObject");
  const drsYaml = extractYamlSchemaShape(openApiText, "CaseBundleDrsObject");
  const drsJson = extractJsonSchemaShape(
    (((jsonSchema.properties as Record<string, unknown>).drsObjects as Record<string, unknown>)
      .items ?? {}) as Record<string, unknown>,
  );

  assertExactMatch(
    "CaseBundleDrsObject properties vs OpenAPI",
    drsTs.properties,
    drsYaml.properties,
    errors,
  );
  assertExactMatch(
    "CaseBundleDrsObject required vs OpenAPI",
    drsTs.required,
    drsYaml.required,
    errors,
  );
  assertExactMatch(
    "CaseBundleDrsObject properties vs JSON Schema",
    drsTs.properties,
    drsJson.properties,
    errors,
  );
  assertExactMatch(
    "CaseBundleDrsObject required vs JSON Schema",
    drsTs.required,
    drsJson.required,
    errors,
  );

  const inputTs = extractInterfaceShape(codeFile, "ExportCaseBundleInput");
  const inputYaml = extractYamlSchemaShape(openApiText, "ExportCaseBundleInput");

  assertExactMatch(
    "ExportCaseBundleInput properties vs OpenAPI",
    inputTs.properties.filter((propertyName) => propertyName !== "caseId"),
    inputYaml.properties,
    errors,
  );

  const snapshotTs = extractInterfaceShape(codeFile, "HomeGenomeCaseSnapshot");
  const snapshotYaml = extractYamlSchemaShape(openApiText, "HomeGenomeCaseSnapshot");

  assertExactMatch(
    "HomeGenomeCaseSnapshot properties vs OpenAPI",
    snapshotTs.properties,
    snapshotYaml.properties,
    errors,
  );
  assertExactMatch(
    "HomeGenomeCaseSnapshot required vs OpenAPI",
    snapshotTs.required,
    snapshotYaml.required,
    errors,
  );

  assertContains(
    "OpenAPI paths",
    openApiText,
    "/cases/{caseId}/snapshot:",
    errors,
  );
  assertContains(
    "OpenAPI paths",
    openApiText,
    "/cases/{caseId}/export-bundle:",
    errors,
  );
  assertContains(
    "OpenAPI caseId path parameter",
    openApiText,
    "- name: caseId",
    errors,
  );
  assertContains(
    "JSON Schema checksum pattern",
    JSON.stringify(jsonSchema),
    "^sha256:[a-f0-9]{64}$",
    errors,
  );

  if (errors.length > 0) {
    console.error("Contract drift detected:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("HomeGenome export contract verification passed.");
}

main();