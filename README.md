SHACL 1.2 Scoring System

An experiment for the SHACL 1.2 working group.
Trying to apply the new idea to formally define SHACL UI widget scoring algorithms in turtle.

- Install deno: `curl -fsSL https://deno.land/install.sh | sh`
- Run: `deno test -A --watch`


Questions:

- Should viewer scores generally be lower than editor scores? So that when no editor matches the dat a can be viewed instead?
- Do we all want to to implement "repair mode"?
- Should we have something in the spec for checking that the value matches with an sh:in (regular SHACL validation)
- Should we allow both shui:editor and shui:preferredEditor? As well as shui:viewer and shui:preferredViewer?