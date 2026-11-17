// NEONFALL's entrypoint for make.fun (Node 22, standard library only).
//
// The game itself is the game/ folder beside this file: plain static files
// (an index.html and its ES modules, no build step, no network) that any
// static server can host. This program hands the entry in: it copies game/
// and screenshots/ into the output directory and writes dossier.json there
// with buildDossier from the vendored make.fun library, byte for byte the
// way the gate rebuilds it.
//
// Run it locally the way the grader does, with an output directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(entryRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(entryRoot, 'screenshots'))) {
  cpSync(join(entryRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (see the kit's RULES.txt): the dossier
// text is cut at 160 KiB, screenshots at 4 files of 256 KiB, and game/ at
// 993 entries / 48 MiB with no path over 1,000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
