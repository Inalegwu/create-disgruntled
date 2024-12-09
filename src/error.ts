import { Data } from 'effect';

export class CommandError extends Data.TaggedError('command-error')<{
  cause: unknown;
}> {}
