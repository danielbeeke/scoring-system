import datasetFactory from "@rdfjs/dataset";
import { getRdf } from "./getRdf.ts";

export const scoreShapes = await getRdf(`./widgets/score-shapes.ttl`);

export const getGeneralScores = async () => {
  const folders = [`editors`, `viewers`];
  const generalScoresGraph = datasetFactory.dataset();
  for (const quad of scoreShapes) generalScoresGraph.add(quad);

  for (const folder of folders) {
    const files = Deno.readDir(`./widgets/${folder}/`);
    for await (const file of files) {
      if (file.isDirectory) continue;
      const widgetGraph = await getRdf(`./widgets/${folder}/${file.name}`);
      for (const quad of widgetGraph) generalScoresGraph.add(quad);
    }
  }
  return generalScoresGraph;
};
