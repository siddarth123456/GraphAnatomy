const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://431de9c6.databases.neo4j.io';

const char1 = ['l', 'I', '1']; // in 8k_X
const char2 = ['l', 'I', '1']; // in 44t_m
const char3 = ['O', '0'];      // in V_q

const users = ['neo4j', '431de9c6'];

const combinations = [];
for (const u of users) {
  for (const c1 of char1) {
    for (const c2 of char2) {
      for (const c3 of char3) {
        combinations.push({
          user: u,
          pass: `eEuduzc8k${c1}XDytnwPVYcJtXBVtDSk44t${c2}m8tV${c3}q-wEE`
        });
      }
    }
  }
}

async function testAll() {
  console.log(`Testing ${combinations.length} combinations...`);
  for (const cred of combinations) {
    const driver = neo4j.driver(uri, neo4j.auth.basic(cred.user, cred.pass));
    try {
      await driver.verifyConnectivity();
      console.log(`\n✅ SUCCESS!`);
      console.log(`User: ${cred.user}`);
      console.log(`Pass: ${cred.pass}`);
      process.exit(0);
    } catch (e) {
      process.stdout.write('.');
    } finally {
      await driver.close();
    }
  }
  console.log('\n❌ All failed.');
}

testAll();
