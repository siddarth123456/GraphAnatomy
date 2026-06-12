import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Neo4jGraphQL } from '@neo4j/graphql';
import neo4j from 'neo4j-driver';
import { typeDefs } from '@/graphql/typeDefs';

// Initialize the Neo4j driver
// In production, these would be process.env.NEO4J_URI, etc.
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'verro_anatomy_dev_secret'
  )
);

const neoSchema = new Neo4jGraphQL({ 
  typeDefs, 
  driver,
  features: {
    // ...
  }
});

let serverPromise: Promise<ApolloServer>;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const schema = await neoSchema.getSchema();
      const server = new ApolloServer({
        schema,
      });
      return server;
    })();
  }
  return serverPromise;
}

// Next.js App Router specific handlers
let nextHandler: ReturnType<typeof startServerAndCreateNextHandler>;

const handler = async (req: Request) => {
  if (!nextHandler) {
    const server = await getServer();
    nextHandler = startServerAndCreateNextHandler(server, {
      context: async () => ({
        executionContext: driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' }),
      }),
    });
  }
  return nextHandler(req);
};

export { handler as GET, handler as POST };
