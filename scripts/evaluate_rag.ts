// scripts/evaluate_rag.ts
// Test script for GraphRAG Foundation Phase 1
async function testRetrieval(query: string) {
  console.log(`\n======================================================`);
  console.log(`Testing Query: "${query}"`);
  console.log(`======================================================`);
  try {
    const response = await fetch('http://localhost:3000/api/retrieval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error("Error:", await response.text());
      return;
    }

    const data = await response.json();
    console.log(`Intent Detected: ${data.intent}`);
    console.log(`Extracted Terms: ${data.extractedTerms}`);
    console.log(`Evidence Count:  ${data.metadata.totalEvidences}`);
    
    if (data.evidence.length > 0) {
      console.log(`\nTop Evidence Sample:`);
      console.log(JSON.stringify(data.evidence[0], null, 2));
    } else {
      console.log(`\nNo evidence retrieved.`);
    }

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

async function runBenchmarks() {
  await testRetrieval("What muscles are innervated by the median nerve?");
  await testRetrieval("What structures are affected in carpal tunnel syndrome?");
  await testRetrieval("Show me structures near the scaphoid.");
}

runBenchmarks();
