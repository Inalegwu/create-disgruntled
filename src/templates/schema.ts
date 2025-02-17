import { Schema } from "effect";

export const TemplateSchema = Schema.Struct({
  name: Schema.String.pipe(),
  version: Schema.String,
  type: Schema.String.pipe(Schema.optional),
  scripts: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }),
  dependencies: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }),
  devDependencies: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }),
});

export type TTemplateSchema = typeof TemplateSchema.Type;
