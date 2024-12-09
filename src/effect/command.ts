import { CommandError } from '@/error';
import { Args, Command } from '@effect/cli';
import { $ } from 'bun';
import { Effect } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.withDefault('my_app'));

export const effect = Command.make('effect', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Creating Effect Project @:"${name}"`);

    yield* Effect.tryPromise({
      try: async () => {
        const lines =
          $`git clone https://github.com/Inalegwu/Gaze ${name}`.lines();

        for await (const line of lines) {
          console.log(line);
        }
      },
      catch: (cause) => new CommandError({ cause }),
    });
  }).pipe(
    Effect.catchTags({
      'command-error': (error) =>
        Effect.gen(function* () {
          yield* Effect.logError(
            `Error occurred while creating your Effect Project: ${error.cause}`,
          );
        }),
    }),
  ),
);
