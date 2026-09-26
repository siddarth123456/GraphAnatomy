import type { AnatomyDataset, AnatomyRelationship, EvidenceNode, RetrievalIntent, RetrievalResponse } from './anatomy-types';

export function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesTerm(query: string, term: string) {
  const normalized = normalizeSearch(term);
  return normalized.length > 1 && ` ${query} `.includes(` ${normalized} `);
}

export function retrieveEvidence(query: string, dataset: AnatomyDataset): RetrievalResponse {
  const normalized = normalizeSearch(query);
  const conditions = dataset.clinicalConditions.filter((condition) => [condition.name, condition.id, ...condition.synonyms].some((term) => includesTerm(normalized, term)));
  const nodes = dataset.structures.filter((node) => [node.name, node.graphNodeId, ...node.searchableTerms].some((term) => includesTerm(normalized, term)));
  const spatial = /\b(near|nearby|nearest|closest|above|below|adjacent|surrounding|distance|next to|within \d)\b/.test(normalized)
    || /\b(anterior|posterior|medial|lateral|proximal|distal|superficial|deep|dorsal|palmar|volar)\s+(to|of)\b/.test(normalized);
  const clinical = conditions.length > 0 || /\b(syndrome|disease|condition|affected|pain|injury|disorder|symptom|symptoms)\b/.test(normalized);
  const intent: RetrievalIntent = spatial ? 'SPATIAL_QUERY' : clinical ? 'CLINICAL_CONDITION_QUERY' : 'ANATOMY_RELATIONSHIP_QUERY';
  let relationshipType: AnatomyRelationship['type'] | undefined;
  const supplyQuestion = /\b(supply|supplies|supplied)\b/.test(normalized);
  const nerveSupply = supplyQuestion && /\b(nerve|neural|nervous)\b/.test(normalized)
    && !/\b(artery|arteries|blood|vascular)\b/.test(normalized);
  if (/\b(innervate|innervates|innervated|innervation)\b/.test(normalized)
    || nerveSupply) relationshipType = 'INNERVATES';
  else if (/\b(supply|supplies|supplied|blood supply)\b/.test(normalized)) relationshipType = 'SUPPLIES';
  else if (/\b(origin|origins|originate|originates)\b/.test(normalized)) relationshipType = 'ORIGINATES_ON';
  else if (/\b(insert|inserts|insertion|insertions)\b/.test(normalized)) relationshipType = 'INSERTS_ON';
  else if (/\b(articulate|articulates|articulation|articulations|joint|joints)\b/.test(normalized)) relationshipType = 'ARTICULATES_WITH';
  const nodeIds = new Set(nodes.map((node) => node.graphNodeId));
  const conditionIds = new Set(conditions.map((condition) => condition.id));
  const matches = spatial ? [] : dataset.relationships.filter((edge) => {
    if (clinical) return edge.type === 'AFFECTED_BY' && (conditionIds.has(edge.target) || nodeIds.has(edge.source));
    return (!relationshipType || edge.type === relationshipType) && (nodeIds.has(edge.source) || nodeIds.has(edge.target));
  });
  function evidenceNode(id: string): EvidenceNode {
    const node = dataset.structures.find((item) => item.graphNodeId === id);
    const condition = dataset.clinicalConditions.find((item) => item.id === id);
    if (!node && !condition) throw new Error('Relationship endpoint is missing from the dataset.');
    return {
      graphNodeId: id, name: node?.name ?? condition!.name,
      fmaId: node?.fmaId ?? null, meshId: node?.asset?.meshId ?? null,
      ontologyValidated: false,
      sourceDataset: node?.asset?.sourceDataset ?? 'Curated educational graph',
      sourceVersion: node?.asset?.sourceVersion ?? dataset.metadata.version,
    };
  }
  const evidence = matches.slice(0, 20).map((edge) => ({
    id: edge.id, sourceNode: evidenceNode(edge.source), targetNode: evidenceNode(edge.target),
    relationship: edge.type, description: edge.description, citation: edge.citation,
    retrievalMethod: 'CURATED_GRAPH' as const, retrievalDepth: 1 as const,
  }));
  return {
    query, intent, status: spatial ? 'unsupported' : evidence.length ? 'ok' : 'no_results',
    message: spatial ? 'Spatial retrieval is not implemented. Graph relationships do not establish physical proximity.' : evidence.length ? `Found ${evidence.length} cited relationship${evidence.length === 1 ? '' : 's'} in the hand dataset. Arrow direction follows the stored anatomical relationship.` : 'No cited relationships matched this query in the limited hand dataset. Try Median Nerve, Abductor Pollicis Brevis, Scaphoid, or Carpal Tunnel Syndrome.',
    extractedTerms: [...nodes.map((node) => node.name), ...conditions.map((condition) => condition.name)], evidence,
    metadata: { timestamp: new Date().toISOString(), totalEvidences: evidence.length, version: dataset.metadata.version, mode: dataset.mode, graphragStage: 'Deterministic entity matching and one-hop curated graph retrieval; no vector search or generated medical answer', truncated: matches.length > evidence.length },
  };
}
