import { Args, Command } from '@effect/cli';
import { $ } from 'bun';
import { Data, Effect, Option } from 'effect';

class DesktopError extends Data.TaggedError('desktop-error')<{
  cause: unknown;
}> {}

const name = Args.text({
  name: 'projectName',
}).pipe(Args.optional);

export const desktop = Command.make('desktop', { name }, ({ name }) =>
  Effect.gen(function* () {
    yield* Option.match(name, {
      onSome: (projectName) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Creating Desktop Project ${name}`);

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/ElectroStatic ${projectName}`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new DesktopError({ cause }),
          });
        }),
      onNone: () =>
        Effect.gen(function* () {
          yield* Effect.logInfo('Creating Desktop Project with Default Name');

          yield* Effect.tryPromise({
            try: async () => {
              const lines =
                $`git clone https://github.com/Inalegwu/ElectroStatic disgruntled_desktop`.lines();

              for await (const line of lines) {
                console.log(line);
              }
            },
            catch: (cause) => new DesktopError({ cause }),
          });
        }),
    });
  }).pipe(
    Effect.catchTags({
      'desktop-error': (error) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(
            `An error occurred attempting to create your desktop project ${String(error.cause).includes('128') ? 'NetworkError' : ''}`,
          );
        }),
    }),
  ),
);
