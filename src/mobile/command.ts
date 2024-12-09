import { CommandError } from '@/error';
import { Args, Command } from '@effect/cli';
import { $ } from 'bun';
import { Effect, Option } from 'effect';

const name = Args.text({
  name: 'projectName',
}).pipe(Args.optional);

export const mobile = Command.make('mobile', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Option.match(name, {
      onSome: (projectName) =>
        Effect.gen(function* () {
          yield* Effect.log(`Creating Mobile Project ${projectName}`);

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Spawnpoint ${projectName}`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CommandError({ cause }),
          });
        }),
      onNone: () =>
        Effect.gen(function* () {
          yield* Effect.logInfo('Creating Mobile Project With Default Name');

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Spawnpoint disgruntled_mobile`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CommandError({ cause }),
          });
        }),
    });
  }).pipe(
    Effect.catchTags({
      'command-error': (error) =>
        Effect.gen(function* () {
          yield* Effect.log(
            `An error occurred attempting to create your mobile project ${error.cause}`,
          );
        }),
    }),
  ),
);
