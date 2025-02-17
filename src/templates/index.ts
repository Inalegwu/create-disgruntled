import { FileSystem, Path } from '@effect/platform';
import { Data, Effect, Match, Option, Schema } from 'effect';
import { TemplateSchema } from './schema';

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

      const init = Effect.fn(function* (
        name: Option.Option<string>,
        opts: Options,
      ) {
        const cmd = Option.getOrElse(opts.manager, () => 'npm' as const);
        const projectName = Option.getOrElse(name, () => 'my-project');
        const template_ = Option.getOrElse(
          opts.template,
          () => 'default' as const,
        );

        const projectDir = path_.join(process.cwd(), projectName);

        yield* Effect.log(projectDir);

        if (fs_.exists(projectDir)) {
          yield* Effect.die(
            new InitError({
              cause: 'Project Directory Already Exists',
              module: 'template-generator-init',
            }),
          );
        }

        yield* fs_.makeDirectory(projectDir, {
          recursive: true,
        });

        const template = yield* getTemplate({
          template: template_,
          command: opts.command,
        });

        const packageManager = yield* getPackageManager({
          command: opts.command,
          manager: cmd,
        });

        const templateDir = path_.resolve(
          __dirname,
          `../../templates/${opts.command}/${template}`,
        );

        if (!fs_.exists(templateDir)) {
          yield* Effect.die(
            new InitError({
              cause: 'Template Does not Exist',
              module: 'template-generator-init',
            }),
          );
        }

        const templateJson = yield* fs_.readFileString(
          path_.join(templateDir, 'template.json'),
        );

        const templateJSON = JSON.parse(templateJson);

        const templateFromSchema =
          yield* Schema.decodeUnknown(TemplateSchema)(templateJSON);

        yield* Effect.logInfo(templateFromSchema);
      });

      return { init } as const;
    }),
  },
) {}

const getPackageManager = (value: {
  command: Options['command'];
  manager: Option.Option.Value<Options['manager']>;
}) =>
  Match.value(value).pipe(
    Match.when({ command: 'desktop', manager: 'pnpm' }, (_) => _.manager),
    Match.when({ command: 'desktop', manager: 'npm' }, (_) => _.manager),
    Match.when({ command: 'desktop', manager: 'yarn' }, (_) => _.manager),
    // force the user to use pnpm...should probably give an error but, we'll see
    Match.when({ command: 'desktop', manager: 'bun' }, () => 'pnpm' as const),
    Match.when({ command: 'mobile', manager: 'bun' }, (_) => _.manager),
    Match.when({ command: 'mobile', manager: 'npm' }, (_) => _.manager),
    Match.when({ command: 'mobile', manager: 'pnpm' }, (_) => _.manager),
    Match.when({ command: 'mobile', manager: 'yarn' }, (_) => _.manager),
    Match.when({ command: 'web', manager: 'bun' }, (_) => _.manager),
    Match.when({ command: 'web', manager: 'npm' }, (_) => _.manager),
    Match.when({ command: 'web', manager: 'pnpm' }, (_) => _.manager),
    Match.when({ command: 'web', manager: 'yarn' }, (_) => _.manager),
    Match.when({ command: 'cli', manager: 'bun' }, (_) => _.manager),
    Match.when({ command: 'cli', manager: 'npm' }, (_) => _.manager),
    Match.when({ command: 'cli', manager: 'pnpm' }, (_) => _.manager),
    Match.when({ command: 'cli', manager: 'yarn' }, (_) => _.manager),
    Match.when({ command: 'api', manager: 'bun' }, (_) => _.manager),
    Match.when({ command: 'api', manager: 'npm' }, (_) => _.manager),
    Match.when({ command: 'api', manager: 'pnpm' }, (_) => _.manager),
    Match.option,
  );

const getTemplate = (value: {
  template: Option.Option.Value<Options['template']> | 'default';
  command: Options['command'];
}) =>
  Match.value(value).pipe(
    Match.when({ command: 'desktop', template: 'reactjs' }, (_) => _.template),
    Match.when({ command: 'desktop', template: 'solidjs' }, (_) => _.template),
    Match.when({ command: 'mobile', template: 'default' }, (_) => _.template),
    Match.when({ command: 'api', template: 'default' }, (_) => _.template),
    Match.when({ command: 'cli', template: 'default' }, (_) => _.template),
    Match.when({ command: 'web', template: 'nextjs' }, (_) => _.template),
    Match.when({ command: 'web', template: 'remixjs' }, (_) => _.template),
    Match.option,
  );
