import { DATASET_ID, getBundledDataset } from './anatomy-data';
import { withNeo4jSession } from './neo4j';
import { ANATOMY_RELATIONSHIP_TYPES } from './anatomy-types';

export async function createIndexes() {
  return withNeo4jSession(async (session) => {
    const statements = [
      'CREATE CONSTRAINT anatomy_graph_id_unique IF NOT EXISTS FOR (n:AnatomicalStructure) REQUIRE n.graphNodeId IS UNIQUE',
      'CREATE CONSTRAINT anatomy_asset_mesh_unique IF NOT EXISTS FOR (n:AnatomyAsset) REQUIRE n.meshId IS UNIQUE',
      'CREATE CONSTRAINT anatomy_condition_id_unique IF NOT EXISTS FOR (n:ClinicalCondition) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT anatomy_system_id_unique IF NOT EXISTS FOR (n:System) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT anatomy_dataset_id_unique IF NOT EXISTS FOR (n:AnatomyDataset) REQUIRE n.id IS UNIQUE',
      'CREATE FULLTEXT INDEX anatomy_search IF NOT EXISTS FOR (n:AnatomicalStructure) ON EACH [n.name, n.searchableTerms, n.graphNodeId]',
      'CREATE FULLTEXT INDEX clinical_search IF NOT EXISTS FOR (n:ClinicalCondition) ON EACH [n.name, n.synonyms, n.id]',
    ];
    for (const statement of statements) await session.run(statement);
    await session.run('CALL db.awaitIndexes(30)');
    return statements.length;
  }, true);
}

/** Upsert the same graph and assets served in bundled mode. Never clears the database. */
export async function seedAnatomy() {
  const dataset = getBundledDataset();
  await createIndexes();
  const nodes = dataset.structures.map((node, sortOrder) => ({
    graphNodeId: node.graphNodeId, name: node.name, category: node.category,
    fmaId: node.fmaId, snomedId: node.snomedId, ontologyValidated: false,
    searchableTerms: node.searchableTerms, description: node.description,
    citationTitle: node.citation?.title ?? null, citationUrl: node.citation?.url ?? null,
    datasetId: DATASET_ID, sortOrder,
  }));
  const assets = dataset.structures.flatMap((node) => node.asset ? [{ ...node.asset, datasetId: DATASET_ID }] : []);
  const systems = [...new Map(dataset.structures.map((node) => [node.system.id, node.system])).values()];
  const conditions = dataset.clinicalConditions.map((node) => ({
    id: node.id, name: node.name, synonyms: node.synonyms, description: node.description,
    citationTitle: node.citation.title, citationUrl: node.citation.url, datasetId: DATASET_ID,
  }));
  await withNeo4jSession(async (session) => session.executeWrite(async (tx) => {
    await tx.run('UNWIND $nodes AS row MERGE (s:AnatomicalStructure {graphNodeId: row.graphNodeId}) SET s = row', { nodes });
    await tx.run('UNWIND $assets AS row MERGE (a:AnatomyAsset {meshId: row.meshId}) SET a = row', { assets });
    await tx.run('UNWIND $systems AS row MERGE (s:System {id: row.id}) SET s.name = row.name', { systems });
    await tx.run('UNWIND $conditions AS row MERGE (c:ClinicalCondition {id: row.id}) SET c = row', { conditions });
    // Replace only asset/system links on structures managed by this dataset. This keeps
    // graph-only anatomy free of obsolete placeholder assets on repeated seeds.
    await tx.run('MATCH (s:AnatomicalStructure {datasetId: $datasetId})-[r:HAS_ASSET|BELONGS_TO]->() DELETE r', { datasetId: DATASET_ID });
    await tx.run(`UNWIND $rows AS row MATCH (s:AnatomicalStructure {graphNodeId: row.id})
      MATCH (system:System {id: row.systemId}) MERGE (s)-[:BELONGS_TO]->(system)`, {
      rows: dataset.structures.map((node) => ({ id: node.graphNodeId, systemId: node.system.id })),
    });
    await tx.run(`UNWIND $rows AS row MATCH (s:AnatomicalStructure {graphNodeId: row.id})
      MATCH (a:AnatomyAsset {meshId: row.meshId}) MERGE (s)-[:HAS_ASSET]->(a)`, {
      rows: dataset.structures.flatMap((node) => node.asset ? [{ id: node.graphNodeId, meshId: node.asset.meshId }] : []),
    });
    const allowed = new Set<string>(ANATOMY_RELATIONSHIP_TYPES);
    for (const [sortOrder, edge] of dataset.relationships.entries()) {
      if (!allowed.has(edge.type)) throw new Error('Unsupported relationship type in canonical data.');
      await tx.run(`MATCH (source:AnatomicalStructure {graphNodeId: $source})
        MATCH (target) WHERE (target:AnatomicalStructure AND target.graphNodeId = $target) OR (target:ClinicalCondition AND target.id = $target)
        MERGE (source)-[r:${edge.type} {id: $id}]->(target) SET r = $properties`, {
        source: edge.source, target: edge.target, id: edge.id,
        properties: { id: edge.id, description: edge.description, citationTitle: edge.citation.title, citationUrl: edge.citation.url, datasetId: DATASET_ID, sortOrder },
      });
    }
    await tx.run(`MATCH ()-[r]->() WHERE r.datasetId = $datasetId AND r.id IS NOT NULL AND NOT r.id IN $ids DELETE r`, { datasetId: DATASET_ID, ids: dataset.relationships.map((edge) => edge.id) });
    await tx.run('MERGE (d:AnatomyDataset {id: $id}) SET d.metadata = $metadata', { id: DATASET_ID, metadata: JSON.stringify(dataset.metadata) });
  }), true);
  return { structures: nodes.length, assets: assets.length, conditions: conditions.length, relationships: dataset.relationships.length };
}
