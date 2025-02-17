import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);
const framework = Options.choice('variant', ['reactjs', 'solidjs']).pipe(
  Options.withAlias('v'),
  Options.optional,
);

export const desktop = Command.make(
  'desktop',
  { name, framework },
  ({ name, framework }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () => handleCreate('reactjs', name),
        onSome: (variant) => handleCreate(variant, name),
      });
    }),
);

function handleCreate(
  template: 'reactjs' | 'solidjs',
  name: Option.Option<string>,
) {
  return Effect.gen(function* () {
    const templateGen = yield* Init;

    yield* Effect.logInfo(
      `Creating Desktop Project @: ${Option.getOrUndefined(
        name,
      )} with Template ${template}`,
    );

    yield* templateGen.init(name, {
      command: 'desktop',
      template: Option.some(template),
      manager: Option.none(),
    });
  }).pipe(Effect.provide(Init.Default), Effect.orDie);
}
