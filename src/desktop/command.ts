import { Args, Command, Options } from '@effect/cli';
import { $ } from 'bun';
import { Data, Effect, Match } from 'effect';

class DesktopError extends Data.TaggedError('desktop-error')<{
  cause: unknown;
}> {}

const name = Args.text({
  name: 'projectName',
});

const install = Options.boolean('install');

export const desktop = Command.make(
  'desktop',
  { name, install },
  ({ name, install }) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`Creating Desktop Project ${name}`);

      yield* Effect.tryPromise({
        try: async () => {
          const lines =
            $`git clone https://github.com/Inalegwu/ElectroStatic ${name}`.lines();

          for await (const line of lines) {
            console.log(line);
          }
        },
        catch: (cause) => new DesktopError({ cause }),
      });

      Match.value(install).pipe(
        Match.when(true, () =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: async () => await $`cd ${name}`,
              catch: (cause) => new DesktopError({ cause }),
            });

            const output = yield* Effect.tryPromise({
              try: async () => await $`pnpm install`.lines(),
              catch: (cause) => new DesktopError({ cause }),
            });
            yield* Effect.logInfo(output);
          }),
        ),
        Match.when(false, () =>
          Effect.gen(function* () {
            yield* Effect.logInfo('Project Created Successfully');
            yield* Effect.logInfo(`cd into "${name}" to start working`);
          }),
        ),
        Match.exhaustive,
      );
    }).pipe(
      Effect.catchTags({
        'desktop-error': () =>
          Effect.gen(function* () {
            yield* Effect.logInfo(
              'An error occurred attempting to create your project',
            );
          }),
      }),
    ),
);
