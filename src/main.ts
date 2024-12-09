import { api } from '@/api/command';
import { desktop } from '@/desktop/command';
import { effect } from '@/effect/command';
import { mobile } from '@/mobile/command';
import { web } from '@/web/command';
import { Command } from '@effect/cli';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect } from 'effect';
import pkg from '../package.json';

const main = Command.make('disgruntled').pipe(
  Command.withSubcommands([desktop, mobile, effect, api, web]),
);

const program = Command.run(main, {
  name: 'Create Disgruntled App',
  version: `v${pkg.version}`,
});

program(process.argv).pipe(
  Effect.provide(BunContext.layer),
  BunRuntime.runMain,
);
