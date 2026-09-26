import type { AnatomyDataset, AnatomyRelationship, AnatomicalStructure, ClinicalCondition, DataMode } from './anatomy-types';
import { DATASET_ID, getBundledDataset } from './anatomy-data';
import { AnatomyDataError, withNeo4jSession } from './neo4j';

export function getDataMode(): DataMode {
  const mode = process.env.ANATOMY_DATA_MODE ?? 'bundled';
  if (mode !== 'bundled' && mode !== 'neo4j') throw new AnatomyDataError('ANATOMY_DATA_MODE must be bundled or neo4j.');
  return mode;
}

export async function getAnatomyDataset(): Promise<AnatomyDataset> {
  if (getDataMode() === 'bundled') return getBundledDataset();
  try {
    return await withNeo4jSession(async (session) => session.executeRead(async (tx) => {
      const metadataResult = await tx.run('MATCH (d:AnatomyDataset {id: $datasetId}) RETURN d.metadata AS metadata', { datasetId: DATASET_ID });
      if (!metadataResult.records.length) throw new AnatomyDataError('The hand dataset is not seeded in Neo4j. Run npm run seed for this database.');
      const params = { datasetId: DATASET_ID };
      const structureResult = await tx.run(`MATCH (s:AnatomicalStructure {datasetId: $datasetId})
        OPTIONAL MATCH (s)-[:HAS_ASSET]->(a:AnatomyAsset)
        OPTIONAL MATCH (s)-[:BELONGS_TO]->(system:System)
        RETURN s, a, system ORDER BY s.sortOrder`, params);
      const conditionResult = await tx.run('MATCH (c:ClinicalCondition {datasetId: $datasetId}) RETURN c ORDER BY c.id', params);
      const relationshipResult = await tx.run(`MATCH (source:AnatomicalStructure {datasetId: $datasetId})-[r]->(target)
        WHERE r.datasetId = $datasetId AND r.id IS NOT NULL
        RETURN r, type(r) AS type, source.graphNodeId AS source, coalesce(target.graphNodeId, target.id) AS target ORDER BY r.sortOrder`, params);
      const structures: AnatomicalStructure[] = structureResult.records.map((record) => {
        const props = record.get('s').properties;
        const asset = record.get('a')?.properties;
        const system = record.get('system')?.properties;
        if (!system) throw new AnatomyDataError('Neo4j dataset is incomplete. Run npm run seed to restore the canonical hand dataset.');
        return {
          graphNodeId: props.graphNodeId, name: props.name, fmaId: props.fmaId ?? null,
          snomedId: props.snomedId ?? null, ontologyValidated: false, category: props.category,
          searchableTerms: props.searchableTerms, description: props.description,
          citation: props.citationUrl ? { title: props.citationTitle, url: props.citationUrl } : null,
          system: { id: system.id, name: system.name },
          asset: asset ? { meshId: asset.meshId, glbPath: asset.glbPath, manifestPath: asset.manifestPath, sourceDataset: asset.sourceDataset, sourceVersion: asset.sourceVersion } : null,
        };
      });
      const clinicalConditions: ClinicalCondition[] = conditionResult.records.map((record) => {
        const p = record.get('c').properties;
        return { id: p.id, name: p.name, synonyms: p.synonyms, description: p.description, citation: { title: p.citationTitle, url: p.citationUrl } };
      });
      const relationships: AnatomyRelationship[] = relationshipResult.records.map((record) => {
        const p = record.get('r').properties;
        return { id: p.id, source: record.get('source'), target: record.get('target'), type: record.get('type'), description: p.description, citation: { title: p.citationTitle, url: p.citationUrl } };
      });
      const metadata: AnatomyDataset['metadata'] = JSON.parse(metadataResult.records[0].get('metadata'));
      if (structures.length !== metadata.structureCount || relationships.length !== metadata.relationshipCount) throw new AnatomyDataError('Neo4j dataset is incomplete. Run npm run seed to restore the canonical hand dataset.');
      return { mode: 'neo4j', structures, clinicalConditions, relationships, metadata };
    }));
  } catch (error) {
    if (error instanceof AnatomyDataError) throw error;
    throw new AnatomyDataError('Neo4j is unavailable. Check the configured connection and database. No bundled fallback was used.');
  }
}
