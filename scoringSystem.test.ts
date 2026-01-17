import { widgetScoringSystem } from "./scoringSystem.ts";
import { assertEquals } from "@std/assert";
import datasetFactory from "@rdfjs/dataset";
import { shui } from "./helpers/namespaces.ts";
import { exists } from "@std/fs/exists";
import { getRdf } from "./helpers/getRdf.ts";
import { getGeneralScores, scoreShapes } from "./helpers/getGeneralScores.ts";

for await (const entry of Deno.readDir("./tests")) {
  if (!entry.isDirectory) continue;

  Deno.test(entry.name, async () => {
    const shapesGraph = await getRdf(`./tests/${entry.name}/shape.ttl`);
    const dataGraph = await getRdf(`./tests/${entry.name}/data.ttl`);
    const widgetScoresGraph = datasetFactory.dataset();
    if (await exists(`./tests/${entry.name}/scores.ttl`)) {
      const scoreQuads = await getRdf(`./tests/${entry.name}/scores.ttl`);
      for (const quad of scoreQuads) widgetScoresGraph.add(quad);
      // Also add the general score shapes so the tests can use them
      for (const scoreShapesQuad of scoreShapes) widgetScoresGraph.add(scoreShapesQuad);
    } else {
      for (const quad of await getGeneralScores()) widgetScoresGraph.add(quad);
    }

    const propertyShapesClosure = await widgetScoringSystem({
      shapesGraph,
      widgetScoresGraph,
      propertyShape: shui("shape"),
    });

    const scores = await propertyShapesClosure({
      dataGraph,
      focusNode: shui("data"),
    });

    console.log(scores)

    const outcome = scores.map((score) => `${score.widget.value.split("#").pop()} ${score.score} ${score.source.value.split("#").pop()}`).join("\n");
    assertEquals(outcome, Deno.readTextFileSync(`./tests/${entry.name}/outcome.txt`).trim());
  });
}
