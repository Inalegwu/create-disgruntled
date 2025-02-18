import { Init } from '@/templates';
import { Args, Command, Options } from '@effect/cli';
import { Effect, Option } from 'effect';

const name = Args.text({ name: 'path' }).pipe(Args.optional);
const framework = Options.choice('variant', ['reactjs', 'solidjs']).pipe(
  Options.withAlias('v'),
  Options.optional,
);
const packageManager = Options.choice('variant', ['pnpm', 'npm', 'yarn']).pipe(
  Options.withAlias('p'),
  Options.optional,
);
const createGitRepo = Options.boolean('git-init').pipe(
  Options.withAlias('g'),
  Options.optional,
);

export const desktop = Command.make(
  'desktop',
  { name, framework, packageManager, createGitRepo },
  ({ name, framework, packageManager, createGitRepo }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () =>
          handleCreate('reactjs', name, packageManager, createGitRepo),
        onSome: (variant) =>
          handleCreate(variant, name, packageManager, createGitRepo),
      });
    }),
);

function handleCreate(
  template: 'reactjs' | 'solidjs',
  name: Option.Option<string>,
  packageManager: Option.Option<'pnpm' | 'npm' | 'yarn'>,
  createGitRepo: Option.Option<boolean>,
) {
  return Effect.gen(function* () {
    const templateGen = yield* Init;

    yield* templateGen.init(name, {
      command: 'desktop',
      template: Option.some(template),
      manager: packageManager,
      shouldGitInit: createGitRepo,
    });
  }).pipe(
    Effect.provide(Init.Default),
    Effect.catchAll((e) => Effect.logError(`${e._tag}:${e.message}`)),
    Effect.annotateLogs({
      command: 'desktop',
    }),
  );
}
