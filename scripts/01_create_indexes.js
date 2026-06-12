const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

async function createFulltextIndexes() {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    console.log("Creating anatomy_search index...");
    await session.run(`
      CREATE FULLTEXT INDEX anatomy_search IF NOT EXISTS 
      FOR (n:AnatomicalStructure) 
      ON EACH [n.name, n.searchableTerms, n.id]
    `);
    console.log("Fulltext index 'anatomy_search' created/verified.");

    console.log("Creating clinical_search index...");
    await session.run(`
      CREATE FULLTEXT INDEX clinical_search IF NOT EXISTS 
      FOR (n:ClinicalCondition) 
      ON EACH [n.name, n.synonyms, n.id]
    `);
    console.log("Fulltext index 'clinical_search' created/verified.");
  } catch (error) {
    console.error("Error creating indexes:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

createFulltextIndexes();
