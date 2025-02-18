import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.withDefault('my_app'));
const framework = Options.choice('variant', ['nextjs', 'remix']).pipe(
  Options.withAlias('v'),
  Options.optional,
);
const packageManager = Options.choice('variant', ['pnpm', 'npm', 'yarn']).pipe(
  Options.withAlias('p'),
  Options.optional,
);
const createGitRepo = Options.boolean('git-init').pipe(
  Options.withAlias('-g'),
  Options.optional,
);

export const web = Command.make(
  'web',
  { name, framework, packageManager, createGitRepo },
  ({ name, framework, packageManager, createGitRepo }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () =>
          handleCreate('nextjs', name, packageManager, createGitRepo),
        onSome: (value) =>
          handleCreate(value, name, packageManager, createGitRepo),
      });
    }),
);

function handleCreate(
  variant: 'nextjs' | 'remix',
  name: string,
  packageManager: Option.Option<'pnpm' | 'npm' | 'yarn' | 'bun'>,
  createGit: Option.Option<boolean>,
) {
  return Effect.gen(function* () {
    yield* Effect.logInfo(
      `Creating Project @: ${name} with ${variant === 'nextjs' ? 'Next JS' : 'Remix'}`,
    );

    const gen = yield* Init;

    yield* gen.init(Option.some(name), {
      command: 'web',
      manager: packageManager,
      template: Option.none(),
      shouldGitInit: createGit,
    });
  }).pipe(
    Effect.catchAll((e) => Effect.logError(e.message)),
    Effect.provide(Init.Default),
  );
}
