import { FileSystem, Path } from '@effect/platform';
import { Array, Console, Data, Effect, Option, Schema, String } from 'effect';
import child_proc from 'node:child_process';
import { username } from 'username';
import { type TTemplateSchema, TemplateSchema } from './schema';

class InitError extends Data.TaggedError('template-error')<{
  cause: unknown;
}> {}

type Options = Readonly<{
  command: 'desktop' | 'cli' | 'mobile' | 'api' | 'web';
  template: Option.Option<'reactjs' | 'solidjs' | 'remixjs' | 'nextjs'>;
  manager: Option.Option<'pnpm' | 'bun' | 'npm' | 'yarn'>;
  shouldGitInit: Option.Option<boolean>;
}>;

export class Init extends Effect.Service<Init>()(
  '@create-disgruntled/template-generator',
  {
    effect: Effect.gen(function* () {
      const fs_ = yield* FileSystem.FileSystem;
      const path_ = yield* Path.Path;
      const thisUser = yield* Effect.tryPromise(
        async () => await username(),
      ).pipe(Effect.andThen((result) => Option.fromNullable(result)));

      const init = Effect.fn(function* (
        name: Option.Option<string>,
        opts: Options,
      ) {
        const cmd = Option.getOrElse(opts.manager, () => 'npm' as const);
        const projectName = Option.getOrElse(name, () => 'my-project');
        const projectDir = path_.join(process.cwd(), projectName);
        const template = Option.getOrElse(
          opts.template,
          () => 'default' as const,
        );
        const shouldRunGit = Option.getOrElse(opts.shouldGitInit, () => true);

        yield* Effect.logInfo(
          `Creating ${String.capitalize(opts.command.toString())} project: ${projectName} with template: ${template}`,
        );

        // ! this is some inverse shit, idfk
        if (!fs_.exists(projectDir)) {
          yield* Effect.logError(`${projectDir} Already Exists`);
          yield* Effect.die(
            new InitError({
              cause: 'Project Directory Already Exists',
            }),
          );
        }

        yield* fs_.makeDirectory(projectDir);

        const templateDir = path_.resolve(
          __dirname,
          `../../templates/${opts.command}/${template}`,
        );

        if (!fs_.exists(templateDir)) {
          yield* Effect.die(
            new InitError({
              cause: 'Template Does not Exist',
            }),
          );
        }

        const templateJson = yield* fs_.readFileString(
          path_.join(templateDir, 'template.json'),
        );

        const schema_ = yield* Schema.decodeUnknown(TemplateSchema)(
          JSON.parse(templateJson),
        );

        const newPackage = {
          ...schema_,
          name: projectName,
          description: 'New DisrguntledDevs Project',
          author: {
            name: thisUser,
            github: `https://github.com/${thisUser}/${projectName}`,
          },
        } satisfies TTemplateSchema;

        yield* fs_.copy(templateDir, projectDir, {
          overwrite: false,
          preserveTimestamps: false,
        });

        yield* fs_.writeFileString(
          path_.join(projectDir, 'package.json'),
          JSON.stringify(newPackage, null, '\t'),
        );

        yield* fs_.remove(path_.join(projectDir, 'template.json'));

        yield* fs_.rename(
          path_.join(projectDir, 'gitignore'),
          path_.join(projectDir, '.gitignore'),
        );

        const deps = Array.fromRecord(newPackage.dependencies);
        const devDeps = Array.fromRecord(newPackage.devDependencies);

        const installDeps = Effect.try(() =>
          child_proc.exec(`${cmd} add ${deps.join(' ')}`, {
            cwd: projectDir,
          }),
        ).pipe(
          Effect.tap((proc) =>
            proc.on('message', (serializable) => {
              Console.log(serializable.toString());
            }),
          ),
          Effect.orDie,
        );

        const installDevDeps = Effect.try(() =>
          child_proc.exec(`${cmd} add -D ${devDeps.join(' ')}`, {
            cwd: projectDir,
          }),
        ).pipe(
          Effect.tap((proc) =>
            proc.on('message', (serializable) =>
              Console.log(serializable.toString()),
            ),
          ),
          Effect.orDie,
        );

        const runGitInit = Effect.try(() =>
          child_proc.exec('git init', {
            cwd: projectDir,
          }),
        );
        const runGitAdd = Effect.try(() =>
          child_proc.exec('git add .', {
            cwd: projectDir,
          }),
        );

        yield* Effect.logInfo(
          `Installing Project Dependencies via ${cmd}...this might take a few minutes`,
        );

        // want to run this sequentially... find out how
        yield* installDeps;
        yield* installDevDeps;

        if (shouldRunGit) {
          yield* runGitInit;
          yield* runGitAdd;
        }
      });

      return { init } as const;
    }),
  },
) {}
