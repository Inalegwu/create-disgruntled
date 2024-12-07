import { Command } from '@effect/cli';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect } from 'effect';
import pkg from '../package.json';
import { desktop } from './desktop/command';
import { mobile } from './mobile/command';

const main = Command.make('disgruntled').pipe(
  Command.withSubcommands([desktop, mobile]),
);

const program = Command.run(main, {
  name: 'Create Disgruntled App',
  version: `v${pkg.version}`,
});

program(process.argv).pipe(
  Effect.provide(BunContext.layer),
  BunRuntime.runMain,
);
