import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);
const framework = Options.choice('variant', ['reactjs', 'solidjs']).pipe(
  Options.withAlias('v'),
  Options.optional,
);
const packageManager = Options.choice('variant', ['pnpm', 'npm', 'yarn']).pipe(
  Options.withAlias('p'),
  Options.optional,
);

export const desktop = Command.make(
  'desktop',
  { name, framework, packageManager },
  ({ name, framework, packageManager }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () => handleCreate('reactjs', name, packageManager),
        onSome: (variant) => handleCreate(variant, name, packageManager),
      });
    }),
);

function handleCreate(
  template: 'reactjs' | 'solidjs',
  name: Option.Option<string>,
  packageManager: Option.Option<'pnpm' | 'npm' | 'yarn'>,
) {
  return Effect.gen(function* () {
    const templateGen = yield* Init;

    yield* Effect.logInfo(
      `Creating Desktop Project @: ${Option.getOrUndefined(
        name,
      )} with Template ${template}`,
    );

    const pm = Option.getOrElse(packageManager, () => 'pnpm' as const);

    yield* templateGen.init(name, {
      command: 'desktop',
      template: Option.some(template),
      manager: Option.some(pm),
    });
  }).pipe(Effect.provide(Init.Default), Effect.orDie);
}
