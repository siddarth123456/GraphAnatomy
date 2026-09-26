import neo4j, { type Driver, type Session } from 'neo4j-driver';

type DriverState = { driver?: Driver; hooksRegistered?: boolean };
const globalForNeo4j = globalThis as typeof globalThis & { anatomyNeo4j?: DriverState };
const state = globalForNeo4j.anatomyNeo4j ??= {};

export class AnatomyDataError extends Error {}

export function getNeo4jDriver(): Driver {
  if (state.driver) return state.driver;
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) throw new AnatomyDataError('Neo4j mode requires NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD. Configure them and seed the database, or choose ANATOMY_DATA_MODE=bundled.');
  state.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    connectionAcquisitionTimeout: 10000, connectionTimeout: 10000, maxTransactionRetryTime: 3000, maxConnectionPoolSize: 10,
  });
  if (!state.hooksRegistered) {
    state.hooksRegistered = true;
    process.once('SIGTERM', () => { void closeNeo4jDriver(); });
    process.once('SIGINT', () => { void closeNeo4jDriver(); });
    process.once('beforeExit', () => { void closeNeo4jDriver(); });
  }
  return state.driver;
}

export async function closeNeo4jDriver() {
  const driver = state.driver;
  state.driver = undefined;
  if (driver) await driver.close();
}

export async function withNeo4jSession<T>(work: (session: Session) => Promise<T>, write = false): Promise<T> {
  const session = getNeo4jDriver().session({
    ...(process.env.NEO4J_DATABASE ? { database: process.env.NEO4J_DATABASE } : {}),
    defaultAccessMode: write ? neo4j.session.WRITE : neo4j.session.READ,
  });
  try { return await work(session); } finally { await session.close(); }
}
