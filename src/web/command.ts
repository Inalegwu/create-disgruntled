import { CommandError } from '@/error';
import { Args, Command, Options } from '@effect/cli';
import { $ } from 'bun';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.withDefault('my_app'));
const framework = Options.choice('variant', ['nextjs', 'remix']).pipe(
  Options.withAlias('v'),
  Options.optional,
);

export const web = Command.make(
  'web',
  { name, framework },
  ({ name, framework }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () => handleCreate('nextjs', name),
        onSome: (value) => handleCreate(value, name),
      });
    }),
);

function handleCreate(variant: 'nextjs' | 'remix', name: string) {
  return Effect.gen(function* () {
    yield* Effect.logInfo(
      `Creating Project @: ${name} with ${variant === 'nextjs' ? 'Next JS' : 'Remix'}`,
    );

    yield* Effect.tryPromise({
      try: async () => {
        const lines =
          $`git clone https://github.com/Inalegwu/${variant === 'nextjs' ? 'Spectron' : 'BluePrint'} ${name}`.lines();

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
          yield* Effect.logError(`Error creating your API App ${error.cause}`);
        }),
    }),
  );
}
