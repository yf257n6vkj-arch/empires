/**
 * Generates the encyclopedia pictures for the technologies with Google's
 * Gemini API and saves them to src/web/techs/<id>.jpg.
 *
 *   GEMINI_API_KEY=... npm run images                 all missing pictures
 *   GEMINI_API_KEY=... npm run images -- --only wheel,iron   just these, even if they exist
 *   npm run images -- --dry-run                       show what would be generated
 *
 * In a Claude cloud session the key can be stored as a network secret for
 * generativelanguage.googleapis.com (header x-goog-api-key); the agent proxy
 * then adds it to every request and GEMINI_API_KEY is not needed.
 *
 * Options: --model <id> (default gemini-nano-banana-2.1), --size 1K|2K,
 * --parallel <n> (default 2). Pictures that already exist are skipped, so a
 * run that stops halfway can simply be started again.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/web/techs");
const prompts = JSON.parse(readFileSync(join(root, "tools/image-prompts.json"), "utf8")) as {
  style: string;
  scenes: Record<string, string>;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const dryRun = process.argv.includes("--dry-run");
const only = arg("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const model = arg("model") ?? process.env.GEMINI_IMAGE_MODEL ?? "gemini-nano-banana-2.1";
const size = arg("size") ?? "1K";
const parallel = Math.max(1, Number(arg("parallel") ?? 2));
const key = process.env.GEMINI_API_KEY;

const unknown = (only ?? []).filter((id) => !(id in prompts.scenes));
if (unknown.length) {
  console.error(`Unknown technologies: ${unknown.join(", ")}`);
  process.exit(1);
}
const todo = Object.keys(prompts.scenes).filter((id) =>
  only ? only.includes(id) : !["jpg", "jpeg", "png", "webp"].some((ext) => existsSync(join(outDir, `${id}.${ext}`))),
);

if (dryRun || todo.length === 0) {
  console.log(todo.length ? `Would generate ${todo.length} pictures: ${todo.join(", ")}` : "All pictures already exist.");
  process.exit(0);
}
if (!key && !process.env.HTTPS_PROXY) {
  console.error("GEMINI_API_KEY is missing. Create a key in Google AI Studio and run: GEMINI_API_KEY=... npm run images");
  process.exit(1);
}

// In the cloud workspace all traffic goes through a proxy that Node's fetch does not use on its own.
if (process.env.HTTPS_PROXY) {
  const { ProxyAgent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

interface Content {
  type?: string;
  data?: string;
  mime_type?: string;
}
interface InteractionResponse {
  steps?: { type?: string; content?: Content[] }[];
  output_image?: Content;
  error?: { message?: string };
}

function findImage(r: InteractionResponse): Content | null {
  for (const step of r.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const c of step.content ?? []) if (c.type === "image" && c.data) return c;
  }
  return r.output_image?.data ? r.output_image : null;
}

async function generate(id: string): Promise<void> {
  const body = {
    model,
    input: `${prompts.style} ${prompts.scenes[id]}`,
    response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "4:3", image_size: size },
  };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      // Without a key here the cloud proxy adds it from the environment's network secret.
      headers: { ...(key ? { "x-goog-api-key": key } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (res.status === 429 || res.status >= 500) {
      const wait = 5000 * attempt;
      console.log(`  ${id}: the service is overloaded (${res.status}), retrying in ${wait / 1000} s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`${id}: ${res.status} ${text.slice(0, 400)}`);
    const image = findImage(JSON.parse(text) as InteractionResponse);
    if (!image?.data) throw new Error(`${id}: the response holds no image: ${text.slice(0, 400)}`);
    const ext = image.mime_type === "image/png" ? "png" : "jpg";
    writeFileSync(join(outDir, `${id}.${ext}`), Buffer.from(image.data, "base64"));
    return;
  }
  throw new Error(`${id}: failed after four attempts`);
}

mkdirSync(outDir, { recursive: true });
console.log(`Generating ${todo.length} pictures with ${model} (${size}, 4:3), ${parallel} at a time.`);
const failed: string[] = [];
let next = 0;
let done = 0;
await Promise.all(
  Array.from({ length: parallel }, async () => {
    while (next < todo.length) {
      const id = todo[next++]!;
      try {
        await generate(id);
        console.log(`[${++done}/${todo.length}] ${id}`);
      } catch (e) {
        failed.push(id);
        console.error(`[${++done}/${todo.length}] ${(e as Error).message}`);
      }
    }
  }),
);
if (failed.length) {
  console.error(`\nFailed: ${failed.join(", ")}. Run the command again; finished pictures are skipped.`);
  process.exit(1);
}
console.log("Hotovo.");
