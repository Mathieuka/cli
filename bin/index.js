#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { createRequire } from "module";

// Import Third-party Dependencies
import kleur from "kleur";
import sade from "sade";
import semver from "semver";
import * as i18n from "@nodesecure/i18n";
import * as vuln from "@nodesecure/vuln";
import { loadRegistryURLFromLocalSystem } from "@nodesecure/npm-registry-sdk";

// Import Internal Dependencies
import * as commands from "../src/commands/index.js";

// TODO: replace with await import() when available
const require = createRequire(import.meta.url);
const manifest = require("../package.json");

console.log(kleur.grey().bold(`\n > ${i18n.getToken("cli.executing_at")}: ${kleur.yellow().bold(process.cwd())}\n`));

const minVersion = semver.minVersion(manifest.engines.node);
if (semver.lt(process.versions.node, minVersion)) {
  console.log(kleur.red().bold(` [!] ${i18n.getToken("cli.min_nodejs_version", minVersion)}\n`));
  process.exit(0);
}

loadRegistryURLFromLocalSystem();

const prog = sade(manifest.name).version(manifest.version);

prog
  .command("hydrate-db")
  .describe(i18n.getToken("cli.commands.hydrate_db.desc"))
  .action(commands.vulnerability.hydrate);

defaultScannerCommand("cwd", { strategy: vuln.strategies.NPM_AUDIT })
  .describe(i18n.getToken("cli.commands.cwd.desc"))
  .option("-n, --nolock", i18n.getToken("cli.commands.cwd.option_nolock"), false)
  .option("-f, --full", i18n.getToken("cli.commands.cwd.option_full"), false)
  .action(commands.scanner.cwd);

defaultScannerCommand("from <package>")
  .describe(i18n.getToken("cli.commands.from.desc"))
  .action(commands.scanner.from);

defaultScannerCommand("auto [package]", { includeOutput: false, strategy: vuln.strategies.SECURITY_WG })
  .describe(i18n.getToken("cli.commands.auto.desc"))
  .option("-k, --keep", i18n.getToken("cli.commands.auto.option_keep"), false)
  .action(commands.scanner.auto);

prog
  .command("open [json]")
  .describe(i18n.getToken("cli.commands.open.desc"))
  .option("-p, --port", i18n.getToken("cli.commands.open.option_port"), process.env.PORT)
  .action(commands.http.start);

prog
  .command("verify [package]")
  .describe(i18n.getToken("cli.commands.verify.desc"))
  .option("-j, --json", i18n.getToken("cli.commands.verify.option_json"), false)
  .action(commands.verify.main);

prog
  .command("summary [json]")
  .describe(i18n.getToken("cli.commands.summary.desc"))
  .action(commands.summary.main);

prog
  .command("lang")
  .describe(i18n.getToken("cli.commands.lang.desc"))
  .action(commands.lang.set);

prog.parse(process.argv);

function defaultScannerCommand(name, options = {}) {
  const { includeOutput = true, strategy = null } = options;

  const cmd = prog.command(name)
    .option("-d, --depth", i18n.getToken("cli.commands.option_depth"), 4);

  if (includeOutput) {
    cmd.option("-o, --output", i18n.getToken("cli.commands.option_output"), "nsecure-result");
  }
  if (strategy !== null) {
    cmd.option("-s, --vulnerabilityStrategy", i18n.getToken("cli.commands.strategy"), strategy);
  }

  return cmd;
}
