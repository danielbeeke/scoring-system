import { Parser } from "n3";
import datasetFactory from "@rdfjs/dataset";

export const getRdf = async (path: string) => {
  const parser = new Parser({ format: "text/turtle" });
  const text = await Deno.readTextFile(path).then((data) => data.toString());
  try {
    return datasetFactory.dataset(parser.parse(text));
  } catch (error) {
    console.error(`Error parsing RDF from ${path}:`, error);
    throw error;
  }
};
