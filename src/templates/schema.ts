import { Schema } from 'effect';

const AuthorSchema = Schema.Record({
  key: Schema.String,
  value: Schema.String,
});

export const TemplateSchema = Schema.Struct({
  name: Schema.String.pipe(),
  version: Schema.String,
  type: Schema.String.pipe(Schema.optional),
  description: Schema.String.pipe(Schema.optional),
  main: Schema.String.pipe(Schema.optional),
  author: Schema.Union(Schema.String, AuthorSchema).pipe(Schema.optional),
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
