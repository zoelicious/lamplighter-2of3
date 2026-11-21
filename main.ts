// Lamplighter — hand-in script for the best-stealth entry (Agent 3, round 2).
//
// What this file does, in plain terms: it takes the finished game in game/
// (plain static files: game/index.html plus its modules, no network calls)
// together with the four JPEG stills in screenshots/, stages both folders
// into the grader's output directory, and then asks the vendored make.fun
// helper to write the dossier.json summary the judge reads from that
// staged copy. Nothing here edits the game itself; it only packs it.
//
// Run it outside the grader with an override directory, for example:
//   mkdir -p /tmp/lamp-out && MAKEFUN_OUTPUT_DIR=/tmp/lamp-out node main.ts
// Local preview of the game itself stays on `node serve.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join as joinPath } from "node:path";
import { fileURLToPath as urlToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

// Folder this script lives in, and the folder the grader collects from.
// The override is honoured exactly as given: never resolved against the
// working directory, never joined onto another path.
const repoRoot = urlToPath(new URL(".", import.meta.url));
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Caps the scorer enforces (see the kit's gate reference): at most four
// stills, none over 256 KiB; at most 993 files and 48 MiB under game/, and
// no game path longer than 1000 bytes. The dossier text budget is 160 KiB.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144,
  },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Copy one folder from the repo into the hand-in directory, creating the
// destination first so the copy never fails on a missing parent.
function stageFolder(folderName) {
  const from = joinPath(repoRoot, folderName);
  const to = joinPath(handInDir, folderName);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`Lamplighter: staged ${folderName}/ into the hand-in folder.`);
}

mkdirSync(handInDir, { recursive: true });
stageFolder("game");

// The stills folder may be absent from the repo, but the hand-in folder always gets
// the directory itself so the dossier step sees a stable layout.
const stillsSource = joinPath(repoRoot, "screenshots");
const stillsTarget = joinPath(handInDir, "screenshots");
mkdirSync(stillsTarget, { recursive: true });
if (existsSync(stillsSource)) {
  cpSync(stillsSource, stillsTarget, { recursive: true });
  console.log("Lamplighter: staged screenshots/ into the hand-in folder.");
}

const dossierBytes = buildDossier(handInDir, dossierLimits);
writeFileSync(joinPath(handInDir, "dossier.json"), dossierBytes);
console.log(`Lamplighter: hand-in ready at ${handInDir} (dossier.json written).`);
