/**
 * Local Postgres for Wzk.io. Port 5433.
 * Usage: npm run db:dev
 */
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: "./.pgdata",
  user: "whoze",
  password: "whoze",
  port: 5433,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

async function main() {
  const alreadyInitialized = await import("node:fs").then((fs) => fs.existsSync("./.pgdata/PG_VERSION"));
  if (!alreadyInitialized) {
    console.log("Initializing Who Ze Klik Postgres...");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("whoze");
    console.log("Created database 'whoze'.");
  } catch {
    // already exists
  }
  console.log("Postgres ready on postgresql://whoze:whoze@localhost:5433/whoze");
  console.log("Press Ctrl+C to stop.");
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
