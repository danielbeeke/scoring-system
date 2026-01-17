import grapoi from "grapoi";
import factory from "@rdfjs/data-model";
import { Validator } from "shacl-engine";
import TermMap from "@rdfjs/term-map";
import {
  ExecuteOptions,
  GenerateScoreOptions,
  Grapoi,
  InitializationOptions,
  WidgetScore,
} from "./types.ts";
import { rdf, sh, shui, xsd } from "./helpers/namespaces.ts";

// Before we run this function we could prepare the shapesGraph and add property shapes for predicates that do not have a property shape yet.
// For now one shape per widget score, at a later point those scores can be grouped and resolved to a Property UI Component.
export async function widgetScoringSystem({
  shapesGraph,
  widgetScoresGraph,
  propertyShape,
}: InitializationOptions) {
  const pointer = grapoi({ dataset: widgetScoresGraph, factory });
  const validator = new Validator(widgetScoresGraph, { factory });

  const shapeWidgetScores = await generateScores({
    pointer,
    source: shui("shapesGraphShape"),
    // Validate the property shapes against the scores.
    dataGraph: shapesGraph,
    focusNode: propertyShape,
    validator,
  });

  // Extract the path from the property shape
  const shapePointer = grapoi({ dataset: shapesGraph, factory });
  const pathTerm = shapePointer.node(propertyShape).out(sh("path")).term;

  return async function propertyShapesClosure({
    dataGraph,
    focusNode,
  }: ExecuteOptions): Promise<WidgetScore[]> {
    // Navigate from the focus node to the actual value using the path
    const dataPointer = grapoi({ dataset: dataGraph, factory });
    const valueNode = pathTerm
      ? dataPointer.node(focusNode).out(pathTerm).term
      : undefined;

    const dataWidgetScores = await generateScores({
      pointer,
      source: shui("dataGraphShape"),
      // Validate the data against the scores.
      dataGraph,
      focusNode: valueNode || focusNode,
      validator,
    });

    return [...shapeWidgetScores, ...dataWidgetScores].toSorted((a, b) => {
      if (b.score === a.score) {
        return a.widget.value.localeCompare(b.widget.value);
      }
      return b.score - a.score;
    });
  };
}

const types = new TermMap([
  [shui("shapesGraphShape"), "shape"],
  [shui("dataGraphShape"), "data"],
]);

const generateScores = async ({
  pointer,
  source,
  dataGraph,
  focusNode,
  validator,
}: GenerateScoreOptions) => {
  const scores: WidgetScore[] = [];

  const scoresPointer = pointer
    .node()
    .hasOut(shui("widget"))
    .hasOut(shui("score"))
    .hasOut(rdf("type"), shui("WidgetScore"))
    .filter(
      (scoreShape: Grapoi) =>
        !scoreShape
          .out(sh("deactivated"))
          .term?.equals(factory.literal("true", xsd("boolean"))),
    );

  for (const scoreShape of scoresPointer) {
    const widget = scoreShape.out(shui("widget")).term;
    const score = parseFloat(scoreShape.out(shui("score")).term.value);
    const type = types.get(source);

    if (!type) throw new Error(`Unknown score type for source ${source.value}`);
    if (!widget || isNaN(score)) continue;

    const sourceShapes = scoreShape.out(source);

    // Validate all source shapes - they must ALL conform (AND logic)
    try {
      let allConform = true;

      for (const sourceShape of sourceShapes) {
        const validationReport = await validator.validate(
          { dataset: dataGraph, terms: [focusNode] },
          [{ terms: [sourceShape.term] }],
        );

        if (!validationReport.conforms) {
          allConform = false;
          break;
        }
      }

      if (allConform && sourceShapes.ptrs.length > 0) {
        scores.push({
          score,
          type,
          widget,
          source: scoreShape.term,
        });
      }
    } catch (error) {
      const firstShape = sourceShapes.ptrs[0]?.term.value || "unknown";
      console.error(error);
      throw new Error(
        `Error validating focus node ${focusNode.value} against score shape ${firstShape}: ${error}`,
      );
    }
  }

  return scores;
};
