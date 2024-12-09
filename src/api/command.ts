import { CommandError } from '@/error';
import { Args, Command } from '@effect/cli';
import { $ } from 'bun';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'projectName' }).pipe(Args.optional);

export const api = Command.make('api', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Option.match(name, {
      onSome: (projectName) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Creating API Project ${projectName}`);

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Martini ${projectName}`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CommandError({ cause }),
          });
        }),
      onNone: () =>
        Effect.gen(function* () {
          yield* Effect.logInfo('Creating API Project With Default Name');

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Martini my_api`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CommandError({ cause }),
          });
        }),
    });
  }).pipe(Effect.catchTags({})),
);
