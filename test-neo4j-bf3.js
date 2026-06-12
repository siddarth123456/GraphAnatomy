const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://431de9c6.databases.neo4j.io';
const user = '431de9c6';

const charK1 = ['k', 'K'];
const charL1 = ['l', 'I', '1'];
const charB  = ['B', '8'];
const charL2 = ['l', 'I', '1'];
const charO  = ['O', '0'];
const charQ  = ['q', 'g', '9', 'p'];

const combinations = [];

for (const k1 of charK1) {
  for (const l1 of charL1) {
    for (const b of charB) {
      for (const l2 of charL2) {
        for (const o of charO) {
          for (const q of charQ) {
            combinations.push(`eEuduzc8${k1}${l1}XDytnwPVYcJtX${b}VtDSk44t${l2}m8tV${o}${q}-wEE`);
          }
        }
      }
    }
  }
}

async function testAll() {
  console.log(`Testing ${combinations.length} combinations...`);
  
  // Test in batches of 10 to avoid socket exhaustion but speed it up
  const batchSize = 10;
  for (let i = 0; i < combinations.length; i += batchSize) {
    const batch = combinations.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (pass) => {
      const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
      try {
        await driver.verifyConnectivity();
        console.log(`\n✅ SUCCESS!`);
        console.log(`Pass: ${pass}`);
        process.exit(0);
      } catch (e) {
        // silently fail
      } finally {
        await driver.close();
      }
    }));
    process.stdout.write('.');
  }
  console.log('\n❌ All failed.');
}

testAll();
