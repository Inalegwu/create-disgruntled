import { Init } from '@/templates';
import { Args, Command } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);

export const api = Command.make('api', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Creating API Project @: ${name}`);

    const gen = yield* Init;

    yield* gen.init(name, {
      command: 'api',
      manager: Option.some('bun'),
      template: Option.none(),
    });
  }).pipe(Effect.orDie, Effect.provide(Init.Default)),
);
