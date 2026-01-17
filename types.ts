import type { DatasetCore, Term } from "@rdfjs/types";
import grapoi from "grapoi";
import { Validator } from "shacl-engine";

export type InitializationOptions = {
  shapesGraph: DatasetCore;
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
  source: Term;
  valueNode?: Term;
  type: "shape" | "data";
};

export type Grapoi = ReturnType<typeof grapoi>;

export type GenerateScoreOptions = {
  pointer: Grapoi;
  source: Term;
  dataGraph: DatasetCore;
  focusNode: Term;
  validator: Validator
};
