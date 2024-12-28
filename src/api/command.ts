import { CommandError } from "@/error";
import { Args, Command } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { $ } from "bun";
import { Effect } from "effect";

const name = Args.text({ name: "path" }).pipe(Args.withDefault("my_app"));

export const api = Command.make(
  "api",
  { name },
  ({ name }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      yield* Effect.logInfo(`Creating API Project @: ${name}`);

      yield* Effect.tryPromise({
        try: async () => {
          const lines = $`git clone https://github.com/Inalegwu/Martini ${name}`
            .lines();

          for await (const line of lines) {
            console.log(line);
          }
        },
        catch: (cause) => new CommandError({ cause }),
      });
    }).pipe(
      Effect.catchTags({
        "command-error": (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(
              `Error Occurred Creating Your API App ${error.cause}`,
            );
          }),
      }),
    ),
);
