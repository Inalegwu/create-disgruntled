import { CommandError } from "@/error";
import { Args, Command, Options } from "@effect/cli";
import { $ } from "bun";
import { Effect, Option } from "effect";

const name = Args.text({ name: "path" }).pipe(Args.withDefault("my_app"));
const framework = Options.choice("variant", ["reactjs", "solidjs"]).pipe(
  Options.withAlias("v"),
  Options.optional,
);

export const desktop = Command.make(
  "desktop",
  { name, framework },
  ({ name, framework }) =>
    Effect.gen(function* () {
      yield* Option.match(framework, {
        onNone: () => handleCreate("solidjs", name),
        onSome: (variant) => handleCreate(variant, name),
      });
    }),
);

function handleCreate(framework: "reactjs" | "solidjs", name: string) {
  return Effect.gen(function* () {
    yield* Effect.logInfo(
      `Creating Desktop Project @: ${name} with ${
        framework === "reactjs" ? "React JS" : "Solid JS"
      }`,
    );

    yield* Effect.tryPromise({
      try: async () => {
        const lines =
          $`git clone https://github.com/Inalegwu/${framework==="reactjs"?"ElectroStatic":"Solidtron"} ${name}`
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
            `An error occurred attempting to create your desktop project ${
              String(error.cause).includes("128") ? "NetworkError" : ""
            }`,
          );
        }),
    }),
  );
}
