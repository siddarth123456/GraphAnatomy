const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://431de9c6.databases.neo4j.io';

const charL1 = ['l', 'I', '1', 'i']; 
const charL2 = ['l', 'I', '1', 'i']; 
const charO = ['O', '0', 'o'];      
const charS = ['S', '5', 's'];
const charZ = ['z', 'Z', '2'];

const users = ['neo4j', '431de9c6'];

const combinations = [];
for (const u of users) {
  for (const c1 of charL1) {
    for (const c2 of charL2) {
      for (const c3 of charO) {
        for (const c4 of charS) {
          for (const c5 of charZ) {
            combinations.push({
              user: u,
              pass: `eEudu${c5}c8k${c1}XDytnwPVYcJtXBVtD${c4}k44t${c2}m8tV${c3}q-wEE`
            });
          }
        }
      }
    }
  }
}

async function testAll() {
  console.log(`Testing ${combinations.length} combinations...`);
  for (let i = 0; i < combinations.length; i++) {
    const cred = combinations[i];
    const driver = neo4j.driver(uri, neo4j.auth.basic(cred.user, cred.pass));
    try {
      await driver.verifyConnectivity();
      console.log(`\n✅ SUCCESS!`);
      console.log(`User: ${cred.user}`);
      console.log(`Pass: ${cred.pass}`);
      process.exit(0);
    } catch (e) {
      if (i % 50 === 0) process.stdout.write('.');
    } finally {
      await driver.close();
    }
  }
  console.log('\n❌ All failed.');
}

testAll();
