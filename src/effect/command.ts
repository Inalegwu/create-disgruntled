import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);
const packageManager = Options.choice('variant', ['pnpm', 'npm', 'yarn']).pipe(
  Options.withAlias('p'),
  Options.optional,
);

export const effect = Command.make(
  'effect',
  { name, packageManager },
  ({ name, packageManager }) =>
    Effect.gen(function* () {
      const gen = yield* Init;

      yield* gen.init(name, {
        command: 'cli',
        manager: packageManager,
        template: Option.none(),
        shouldGitInit: Option.some(false),
      });
    }).pipe(
      Effect.catchAll((e) => Effect.logError(`${e._tag}:${e.message}`)),
      Effect.provide(Init.Default),
      Effect.annotateLogs({
        command: 'cli',
      }),
    ),
);
