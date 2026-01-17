import { shui, widgetScoringSystem } from "./scoringSystem.ts";
import { assertEquals } from "@std/assert";
import { Parser } from "n3";
import datasetFactory from "@rdfjs/dataset";


const getRdf = async (path: string) => {
  const parser = new Parser({ format: "text/turtle" });
  const text = await Deno.readTextFile(path).then((data) => data.toString());
  return datasetFactory.dataset(parser.parse(text));
};

for await (const entry of Deno.readDir("./tests")) {
  if (!entry.isDirectory) continue;

  Deno.test(entry.name, async () => {
    const shapesGraph = await getRdf(`./tests/${entry.name}/shape.ttl`);
    const dataGraph = await getRdf(`./tests/${entry.name}/data.ttl`);
    const widgetScoresGraph = await getRdf(`./tests/${entry.name}/scores.ttl`);

    const propertyShapesClosure = await widgetScoringSystem({
      shapesGraph,
      widgetScoresGraph,
      propertyShape: shui("shape"),
    });

    const scores = await propertyShapesClosure({ dataGraph, focusNode: shui("data") });

    console.log(scores.filter(score => score.score > 0));

    const x = 1 + 2;
    assertEquals(x, 3);
  });
}
