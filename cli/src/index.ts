#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import * as p from "@clack/prompts";
import { syncCommand } from "./commands/sync.js";
import { accountsCommand } from "./commands/accounts.js";
import { importCommand } from "./commands/import.js";
import { categoriseCommand } from "./commands/categorise.js";
import { anomaliesCommand } from "./commands/anomalies.js";
import { summaryCommand } from "./commands/summary.js";

const program = new Command()
  .name("fin")
  .description("Personal finance CLI for Jacob & Thalya")
  .version("0.0.1");

program.addCommand(syncCommand);
program.addCommand(accountsCommand);
program.addCommand(importCommand);
program.addCommand(categoriseCommand);
program.addCommand(anomaliesCommand);
program.addCommand(summaryCommand);

program.action(async () => {
  p.intro("fin");

  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "sync", label: "Sync UP accounts" },
      { value: "import", label: "Import Macquarie CSV" },
      { value: "categorise", label: "Categorise transactions" },
      { value: "summary", label: "Weekly summary" },
      { value: "accounts", label: "View accounts" },
      { value: "anomalies", label: "Check anomalies" },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  if (action === "sync") {
    await syncCommand.parseAsync([], { from: "user" });
    return;
  }

  if (action === "accounts") {
    await accountsCommand.parseAsync([], { from: "user" });
    return;
  }

  if (action === "import") {
    const file = await p.text({ message: "Path to Macquarie CSV file:" });
    if (p.isCancel(file)) { p.cancel("Cancelled."); process.exit(0); }
    await importCommand.parseAsync([file as string], { from: "user" });
    return;
  }

  if (action === "categorise") {
    await categoriseCommand.parseAsync([], { from: "user" });
    return;
  }

  if (action === "anomalies") {
    await anomaliesCommand.parseAsync([], { from: "user" });
    return;
  }

  if (action === "summary") {
    await summaryCommand.parseAsync([], { from: "user" });
    return;
  }

  // Dispatch will be wired up as commands are built
  p.log.info(`Command "${action}" not yet implemented.`);
  p.outro("Done");
});

program.parse();
