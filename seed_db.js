const fs = require('fs');
const neo4j = require('neo4j-driver');
const path = require('path');

const uri = 'neo4j+s://431de9c6.databases.neo4j.io';
const user = '431de9c6';
const pass = 'eEuduzc8kIXDytnwPVYcJtXBVtDSk44tlm8tVOq-wEE';
const database = '431de9c6';

async function seed() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
  const session = driver.session({ database });

  const filePath = path.join(__dirname, '..', 'backend', 'cypher', '05_hand_expansion.cypher');
  const cypher = fs.readFileSync(filePath, 'utf8');

  try {
    const result = await session.run(cypher);
    console.log('Seed successful:', result.records.map(r => r.get(0)));
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
