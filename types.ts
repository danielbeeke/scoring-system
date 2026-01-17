import type { DatasetCore, Term } from "@rdfjs/types";
import grapoi from "grapoi";

export type InitializationOptions = {
  shapesGraph: DatasetCore;
  dataGraph?: DatasetCore;
  widgetScoresGraph: DatasetCore;
  propertyShape: Term;
};

export type ExecuteOptions = {
  dataGraph: DatasetCore;
  focusNode: Term;
};

export type WidgetScore = {
  widget: Term;
  score: number;
  propertyShape: Term;
  valueNode?: Term;
  type: "shape" | "data";
};

export type Grapoi = ReturnType<typeof grapoi>;

export type GenerateScoreOptions = {
  pointer: Grapoi;
  source: Term;
  shapesGraph: DatasetCore;
  dataGraph: DatasetCore;
  focusNode: Term;
};
