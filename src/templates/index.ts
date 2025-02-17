import { FileSystem, Path } from '@effect/platform';
import { Array, Data, Effect, Option, Schema } from 'effect';
import child_proc from 'node:child_process';
import { username } from 'username';
import { type TTemplateSchema, TemplateSchema } from './schema';

class InitError extends Data.TaggedError('template-error')<{
  cause: unknown;
  module: string;
}> {}

type Options = Readonly<{
  command: 'desktop' | 'cli' | 'mobile' | 'api' | 'web';
  template: Option.Option<'reactjs' | 'solidjs' | 'remixjs' | 'nextjs'>;
  manager: Option.Option<'pnpm' | 'bun' | 'npm' | 'yarn'>;
}>;

export class Init extends Effect.Service<Init>()(
  '@create-disgruntled/template-generator',
  {
    effect: Effect.gen(function* () {
      const fs_ = yield* FileSystem.FileSystem;
      const path_ = yield* Path.Path;
      const thisUser = yield* Effect.tryPromise(async () => await username());

      const init = Effect.fn(function* (
        name: Option.Option<string>,
        opts: Options,
      ) {
        // make sure all our options aren't none by the time we use them
        // by resolving them or providing a default so the input doesn't
        // worry about passing a default
        const cmd = Option.getOrElse(opts.manager, () => 'npm' as const);
        const projectName = Option.getOrElse(name, () => 'my-project');
        const projectDir = path_.join(process.cwd(), projectName);
        const template = Option.getOrElse(
          opts.template,
          () => 'default' as const,
        );

        // ! this one is tricky. by default, fs_.exists() returns whether
        // ! or NOT the project exists, if it does exist, true. doesn't, false,
        // ! so we need to make sure that doesn't exist is true instead of false
        if (!fs_.exists(projectDir)) {
          yield* Effect.logError(`${projectDir} Already Exists`);
          yield* Effect.die(
            new InitError({
              cause: 'Project Directory Already Exists',
              module: 'template-generator-init',
            }),
          );
        }

        // create the directory for the project based on the
        // resolved project directory
        yield* fs_.makeDirectory(projectDir);

        // get the template directory based on the
        // command making the request and the template
        // being requested
        const templateDir = path_.resolve(
          __dirname,
          `../../templates/${opts.command}/${template}`,
        );

        // if the template doesn't exist
        // bail out
        if (!fs_.exists(templateDir)) {
          yield* Effect.die(
            new InitError({
              cause: 'Template Does not Exist',
              module: 'template-generator-init',
            }),
          );
        }
        // load in the templates' package.json
        const templateJson = yield* fs_.readFileString(
          path_.join(templateDir, 'template.json'),
        );

        // and convert to a known format
        const schema_ = yield* Schema.decodeUnknown(TemplateSchema)(
          JSON.parse(templateJson),
        );

        // append our new package data to the old
        const newPackage = {
          ...schema_,
          name: projectName,
          description: 'New DisrguntledDevs Project',
          author: {
            name: thisUser || '',
            github: `https://github.com/${thisUser}/${projectName}`,
          },
        } satisfies TTemplateSchema;

        // copy the template
        yield* fs_.copy(templateDir, projectDir, {
          overwrite: false,
          preserveTimestamps: false,
        });

        // create a package.json file with our
        // new package content
        yield* fs_.writeFileString(
          path_.join(projectDir, 'package.json'),
          JSON.stringify(newPackage, null, '\t'),
        );

        // remove the template's package.json definition
        yield* fs_.remove(path_.join(projectDir, 'template.json'));

        // rename the gitignore file
        yield* fs_.rename(
          path_.join(projectDir, 'gitignore'),
          path_.join(projectDir, '.gitignore'),
        );

        const deps = Array.fromRecord(newPackage.dependencies);
        const devDeps = Array.fromRecord(newPackage.devDependencies);

        // install all dependencies within the project
        const installDeps = Effect.try(() =>
          child_proc.exec(`${cmd} add ${deps.join(' ')}`, {
            cwd: projectDir,
          }),
        ).pipe(Effect.orDie);
        const installDevDeps = Effect.try(() =>
          child_proc.exec(`${cmd} add -D ${devDeps.join(' ')}`, {
            cwd: projectDir,
          }),
        ).pipe(Effect.orDie);

        yield* Effect.logInfo(
          `Installing Project Dependencies via ${cmd}...this might take a few minutes`,
        );

        // execute all installations
        yield* Effect.all([installDeps, installDevDeps], {
          concurrency: 2,
        });
      });

      return { init } as const;
    }),
  },
) {}
