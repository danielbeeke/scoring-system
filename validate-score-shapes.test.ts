import { Validator } from "shacl-engine";
import factory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import { assertEquals } from "@std/assert";
import { getRdf } from "./helpers/getRdf.ts";
import { exists } from "@std/fs/exists";

async function getFilesToValidate(): Promise<string[]> {
  const filesToValidate: string[] = [];

  // Check for scores.ttl in test directories
  for await (const entry of Deno.readDir("./tests")) {
    if (!entry.isDirectory) continue;
    const scoresPath = `./tests/${entry.name}/scores.ttl`;
    if (await exists(scoresPath)) {
      filesToValidate.push(scoresPath);
    }
  }

  // Add all widget editor files
  for await (const file of Deno.readDir("./widgets/editors")) {
    if (file.isDirectory) continue;
    if (file.name.endsWith(".ttl")) {
      filesToValidate.push(`./widgets/editors/${file.name}`);
    }
  }

  // Add all widget viewer files
  for await (const file of Deno.readDir("./widgets/viewers")) {
    if (file.isDirectory) continue;
    if (file.name.endsWith(".ttl")) {
      filesToValidate.push(`./widgets/viewers/${file.name}`);
    }
  }

  return filesToValidate;
}

const shapesGraph = await getRdf("./score-validation.ttl");
const validator = new Validator(shapesGraph, { factory });
const filesToValidate = await getFilesToValidate();

for (const filePath of filesToValidate) {
  Deno.test(`validate WidgetScore shapes in ${filePath}`, async () => {
    const dataGraph = datasetFactory.dataset();

    // Load the score file
    const scoreQuads = await getRdf(filePath);
    for (const quad of scoreQuads) {
      dataGraph.add(quad);
    }

    // For widget files, also load score-shapes.ttl
    if (filePath.startsWith("./widgets/")) {
      const scoreShapes = await getRdf("./widgets/score-shapes.ttl");
      for (const quad of scoreShapes) {
        dataGraph.add(quad);
      }
    }

    // Validate
    const report = await validator.validate({ dataset: dataGraph });

    if (!report.conforms) {
      const errors = report.results.map((result) => {
        const parts = [
          result.message?.[0]?.value || "Validation failed",
          result.focusNode ? `Focus node: ${result.focusNode.value}` : null,
          result.path ? `Path: ${result.path.value}` : null,
          result.value ? `Value: ${result.value.value}` : null,
        ].filter(Boolean);
        return parts.join("\n   ");
      }).join("\n\n");

      throw new Error(`WidgetScore validation failed:\n\n${errors}`);
    }

    assertEquals(report.conforms, true);
  });
}
