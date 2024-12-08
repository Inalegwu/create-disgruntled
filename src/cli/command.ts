import { Args, Command } from '@effect/cli';
import { $ } from 'bun';
import { Data, Effect, Option } from 'effect';

class CliError extends Data.TaggedError('cli-error')<{
  cause: unknown;
}> {}

const name = Args.text({ name: 'projectName' }).pipe(Args.optional);

export const cli = Command.make('cli', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Option.match(name, {
      onSome: (projectName) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(
            `Creating CLI Project with Name "${projectName}"`,
          );

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Gaze ${projectName}`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CliError({ cause }),
          });
        }),
      onNone: () =>
        Effect.gen(function* () {
          yield* Effect.logInfo('Creating CLI Project with Default Name');

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/Gaze my_cli`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new CliError({ cause }),
          });
        }),
    });
  }).pipe(
    Effect.catchTags({
      'cli-error': (error) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(
            `Error occurred while creating your CLI Project: ${error.cause}`,
          );
        }),
    }),
  ),
);
