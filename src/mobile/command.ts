import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);
const packageManager = Options.choice('variant', ['pnpm', 'npm', 'yarn']).pipe(
  Options.withAlias('p'),
  Options.optional,
);
const createGitRepo = Options.boolean('git-init').pipe(
  Options.withAlias('-g'),
  Options.optional,
);

export const mobile = Command.make(
  'mobile',
  { name, packageManager, createGitRepo },
  ({ name, packageManager, createGitRepo }) =>
    Effect.gen(function* () {
      const gen = yield* Init;

      yield* gen.init(name, {
        command: 'mobile',
        manager: packageManager,
        template: Option.none(),
        shouldGitInit: createGitRepo,
      });
    }).pipe(
      Effect.catchAll((e) => Effect.logError(`${e._tag}:${e.message}`)),
      Effect.provide(Init.Default),
      Effect.annotateLogs({
        command: 'mobile',
      }),
    ),
);
