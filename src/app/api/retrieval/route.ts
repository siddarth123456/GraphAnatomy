import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

// Initialize Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'verro_anatomy_dev_secret'
  )
);

// 1. Query Intent Router (Rule-based)
function routeQueryIntent(query: string): 'SPATIAL_QUERY' | 'CLINICAL_CONDITION_QUERY' | 'ANATOMY_RELATIONSHIP_QUERY' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.match(/\b(near|above|below|next to|surrounding|adjacent)\b/)) {
    return 'SPATIAL_QUERY';
  }
  
  if (lowerQuery.match(/\b(syndrome|disease|condition|affected|pain|injury|disorder|symptom)\b/)) {
    return 'CLINICAL_CONDITION_QUERY';
  }
  
  return 'ANATOMY_RELATIONSHIP_QUERY';
}

// Helper to extract keywords naively (strip common question words)
function extractSearchTerms(query: string): string {
  const stopwords = ['what', 'are', 'is', 'the', 'by', 'of', 'in', 'to', 'show', 'me', 'structures', 'muscles', 'bones', 'nerves', 'arteries', 'veins', 'innervated', 'articulate', 'near', 'affected'];
  const words = query.toLowerCase().replace(/[?.,]/g, '').split(' ');
  const terms = words.filter(w => !stopwords.includes(w) && w.length > 2);
  // Join with OR for Neo4j fulltext syntax, or just space. Space is implicit AND in standard Lucene query string, 
  // but let's use OR to be forgiving, e.g., "median OR nerve"
  return terms.join(' OR ');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const intent = routeQueryIntent(query);
    const searchTerms = extractSearchTerms(query);
    
    // Failsafe if terms are empty
    const safeSearchTerms = searchTerms || query.replace(/[?.,]/g, '');

    const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });
    
    let evidencePackage: any[] = [];
    
    try {
      if (intent === 'ANATOMY_RELATIONSHIP_QUERY') {
        // Find the matching anatomy node and its 1-hop relationships
        const cypher = `
          CALL db.index.fulltext.queryNodes("anatomy_search", $searchTerms) YIELD node, score
          MATCH (node)-[r]-(target:AnatomicalStructure)
          // Optionally grab asset info if it exists
          OPTIONAL MATCH (node)-[:HAS_ASSET]->(asset:AnatomyAsset)
          OPTIONAL MATCH (target)-[:HAS_ASSET]->(targetAsset:AnatomyAsset)
          RETURN node, type(r) as relationship, target, asset, targetAsset, score
          ORDER BY score DESC
          LIMIT 10
        `;
        
        const result = await session.run(cypher, { searchTerms: safeSearchTerms });
        
        evidencePackage = result.records.map(record => {
          const source = record.get('node').properties;
          const rel = record.get('relationship');
          const target = record.get('target').properties;
          const asset = record.get('asset') ? record.get('asset').properties : null;
          const targetAsset = record.get('targetAsset') ? record.get('targetAsset').properties : null;
          const score = record.get('score');

          return {
            sourceNode: {
              graphNodeId: source.id,
              name: source.name,
              fmaId: source.fmaId || null,
              meshId: asset ? asset.meshId : null,
              sourceDataset: asset ? asset.sourceDataset : "BodyParts3D",
              sourceVersion: asset ? asset.sourceVersion : "4.0",
              ontologyValidated: true
            },
            relationship: rel,
            targetNode: {
              graphNodeId: target.id,
              name: target.name,
              fmaId: target.fmaId || null,
              meshId: targetAsset ? targetAsset.meshId : null,
            },
            confidence: score,
            retrievalMethod: "GRAPH_FULLTEXT",
            retrievalDepth: 1
          };
        });
      } 
      else if (intent === 'CLINICAL_CONDITION_QUERY') {
        const cypher = `
          CALL db.index.fulltext.queryNodes("clinical_search", $searchTerms) YIELD node, score
          MATCH (node)-[r:AFFECTED_BY]-(anatomy:AnatomicalStructure)
          OPTIONAL MATCH (anatomy)-[:HAS_ASSET]->(asset:AnatomyAsset)
          RETURN node as condition, type(r) as relationship, anatomy, asset, score
          ORDER BY score DESC
          LIMIT 10
        `;
        const result = await session.run(cypher, { searchTerms: safeSearchTerms });
        
        evidencePackage = result.records.map(record => {
          const condition = record.get('condition').properties;
          const rel = record.get('relationship');
          const anatomy = record.get('anatomy').properties;
          const asset = record.get('asset') ? record.get('asset').properties : null;
          const score = record.get('score');

          return {
            sourceNode: {
              graphNodeId: condition.id,
              name: condition.name,
              ontologyValidated: true
            },
            relationship: rel,
            targetNode: {
              graphNodeId: anatomy.id,
              name: anatomy.name,
              fmaId: anatomy.fmaId || null,
              meshId: asset ? asset.meshId : null,
            },
            confidence: score,
            retrievalMethod: "GRAPH_FULLTEXT",
            retrievalDepth: 1
          };
        });
      }
      else if (intent === 'SPATIAL_QUERY') {
        // For spatial, we might look for nodes connected via some spatial relationship if we had it,
        // or just fallback to graph neighbors as a proxy for "near" until we have spatial embeddings.
        const cypher = `
          CALL db.index.fulltext.queryNodes("anatomy_search", $searchTerms) YIELD node, score
          MATCH (node)-[r]-(target:AnatomicalStructure)
          OPTIONAL MATCH (node)-[:HAS_ASSET]->(asset:AnatomyAsset)
          OPTIONAL MATCH (target)-[:HAS_ASSET]->(targetAsset:AnatomyAsset)
          RETURN node, type(r) as relationship, target, asset, targetAsset, score
          ORDER BY score DESC
          LIMIT 10
        `;
        const result = await session.run(cypher, { searchTerms: safeSearchTerms });
        
        evidencePackage = result.records.map(record => {
          const source = record.get('node').properties;
          const rel = record.get('relationship');
          const target = record.get('target').properties;
          const asset = record.get('asset') ? record.get('asset').properties : null;
          const targetAsset = record.get('targetAsset') ? record.get('targetAsset').properties : null;
          const score = record.get('score');

          return {
            sourceNode: {
              graphNodeId: source.id,
              name: source.name,
              fmaId: source.fmaId || null,
              meshId: asset ? asset.meshId : null,
              sourceDataset: asset ? asset.sourceDataset : "BodyParts3D",
              sourceVersion: asset ? asset.sourceVersion : "4.0",
              ontologyValidated: true
            },
            relationship: rel,
            targetNode: {
              graphNodeId: target.id,
              name: target.name,
              fmaId: target.fmaId || null,
              meshId: targetAsset ? targetAsset.meshId : null,
            },
            confidence: score,
            retrievalMethod: "GRAPH_SPATIAL_PROXY",
            retrievalDepth: 1
          };
        });
      }
      
    } finally {
      await session.close();
    }

    // Wrap the evidence in a final Context Builder package
    const responsePackage = {
      query,
      intent,
      extractedTerms: searchTerms,
      evidence: evidencePackage,
      metadata: {
        timestamp: new Date().toISOString(),
        totalEvidences: evidencePackage.length,
        version: "1.0",
        graphragStage: "Phase 1 - Fulltext + Graph Traversal"
      }
    };

    return NextResponse.json(responsePackage, { status: 200 });

  } catch (error: any) {
    console.error("Retrieval Error:", error);
    return NextResponse.json({ error: error.message || "Internal Retrieval Error" }, { status: 500 });
  }
}
