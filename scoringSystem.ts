import type { DatasetCore, Term } from "@rdfjs/types";
import grapoi from "grapoi";
import factory from "@rdfjs/data-model";
import { Validator } from "shacl-engine";
import namespace from "@rdfjs/namespace";

export const shui = namespace("http://www.w3.org/ns/shacl-ui#");
export const rdf = namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
export const sh = namespace("http://www.w3.org/ns/shacl#");

type InitializationOptions = {
  shapesGraph: DatasetCore;
  dataGraph?: DatasetCore;
  widgetScoresGraph: DatasetCore;
  propertyShape: Term;
};

type ExecuteOptions = {
  dataGraph: DatasetCore;
  focusNode: Term;
};

// Before we run this function we could prepare the shapesGraph and add property shapes for predicates that do not have a property shape yet.

// For now one shape per widget score, at a later point those scores can be grouped and resolved to a Property UI Component.
type WidgetScore = {
  widget: Term;
  score: number;
  propertyShape: Term;
  valueNode?: Term;
  type: "shape" | "data";
};

type Grapoi = ReturnType<typeof grapoi>;

type GenerateScoreOptions = {
  pointer: Grapoi;
  source: Term;
  shapesGraph: DatasetCore;
  dataGraph: DatasetCore;
  focusNode: Term;
};

export async function widgetScoringSystem({
  shapesGraph,
  widgetScoresGraph,
  propertyShape,
}: InitializationOptions) {
  const pointer = grapoi({ dataset: widgetScoresGraph, factory });

  const shapeWidgetScores = await generateScores({
    pointer,
    source: shui("shapesGraphShape"),
    shapesGraph: widgetScoresGraph,
    // Validate the property shapes against the scores.
    dataGraph: shapesGraph,
    focusNode: propertyShape,
  });

  return async function propertyShapesClosure ({
    dataGraph,
    focusNode,
  }: ExecuteOptions): Promise<WidgetScore[]> {
    const dataWidgetScores = await generateScores({
      pointer,
      source: shui("dataGraphShape"),
      shapesGraph: widgetScoresGraph,
      // Validate the data against the scores.
      dataGraph,
      focusNode,
    });

    return [...shapeWidgetScores, ...dataWidgetScores];
  };
}

const generateScores = async ({
  pointer,
  source,
  shapesGraph,
  dataGraph,
  focusNode,
}: GenerateScoreOptions) => {
  const scores: WidgetScore[] = [];

  const scoresPointer = pointer
    .node()
    .hasOut(shui("widget"))
    .hasOut(shui("score"))
    .hasOut(rdf("type"), shui("Score"))
    .filter(
      (scoreShape: Grapoi) =>
        scoreShape.out(sh("deactivated")).term?.value !== "true",
    );

  for (const scoreShape of scoresPointer) {
    const widget = scoreShape.out(shui("widget")).term;
    const score = parseFloat(scoreShape.out(shui("score")).term.value);
    const type = shui("shapesGraphShape").equals(source) ? "shape" : "data";

    if (!widget || isNaN(score)) continue;

    const sourceShapes = scoreShape.out(source);

    for (const sourceShape of sourceShapes) {
      const scoreValidator = new Validator(shapesGraph, { factory });
      const validationReport = await scoreValidator.validate(
        { dataset: dataGraph, terms: [focusNode] },
        [{ terms: [sourceShape.term] }],
      );

      if (!validationReport.conforms) break;

      scores.push({
        widget,
        score,
        type,
        propertyShape: scoreShape.term,
      });
    }
  }
  return scores;
};
