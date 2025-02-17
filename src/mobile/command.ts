import { Init } from '@/templates';
import { Args, Command } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);

export const mobile = Command.make('mobile', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Effect.log(`Creating Mobile Project @: ${name}`);
    const gen = yield* Init;

    yield* gen.init(name, {
      command: 'mobile',
      manager: Option.none(),
      template: Option.none(),
    });
  }).pipe(Effect.orDie, Effect.provide(Init.Default)),
);
