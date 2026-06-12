const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://431de9c6.databases.neo4j.io';

const variations = [
  { user: 'neo4j', pass: 'eEuduzc8klXDytnwPVYcJtXBVtDSk44tlm8tVOq-wEE' },
  { user: 'neo4j', pass: 'eEuduzc8kIXDytnwPVYcJtXBVtDSk44tIm8tVOq-wEE' },
  { user: '431de9c6', pass: 'eEuduzc8klXDytnwPVYcJtXBVtDSk44tlm8tVOq-wEE' },
  { user: '431de9c6', pass: 'eEuduzc8kIXDytnwPVYcJtXBVtDSk44tIm8tVOq-wEE' },
  { user: 'neo4j', pass: 'eEuduzc8k1XDytnwPVYcJtXBVtDSk44t1m8tVOq-wEE' },
  { user: '431de9c6', pass: 'eEuduzc8k1XDytnwPVYcJtXBVtDSk44t1m8tVOq-wEE' },
];

async function testAll() {
  for (const cred of variations) {
    const driver = neo4j.driver(uri, neo4j.auth.basic(cred.user, cred.pass));
    try {
      await driver.verifyConnectivity();
      console.log(`SUCCESS! user: ${cred.user}, pass: ${cred.pass}`);
      process.exit(0);
    } catch (e) {
      console.log(`Failed: ${cred.user} / ${cred.pass} -> ${e.code}`);
    } finally {
      await driver.close();
    }
  }
}

testAll();
