/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI loads shared TypeScript through tsx. */
/* Local CLI: all connection settings come from environment variables or .env.local. */
require('@next/env').loadEnvConfig(process.cwd());
require('tsx/cjs');
const { seedAnatomy } = require('./src/lib/seed.ts');
const { closeNeo4jDriver, AnatomyDataError } = require('./src/lib/neo4j.ts');

(async () => {
  try {
    const counts = await seedAnatomy();
    console.log('Canonical hand dataset seeded:', counts);
  } catch (error) {
    console.error(error instanceof AnatomyDataError ? error.message : 'Neo4j seed failed. Check connection settings, database access and Neo4j logs.');
    process.exitCode = 1;
  } finally {
    await closeNeo4jDriver();
  }
})();
