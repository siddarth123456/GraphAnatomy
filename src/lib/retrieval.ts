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
  const padded = ` ${normalized} `;
  const nodeMatches = dataset.structures.flatMap((node) => [...new Set([node.name, node.graphNodeId, ...node.searchableTerms].map(normalizeSearch))]
    .flatMap(term => {
      const hits: { node: typeof node; term: string; start: number; end: number }[] = [];
      if (term.length < 2) return hits;
      for (let start = padded.indexOf(` ${term} `); start >= 0; start = padded.indexOf(` ${term} `, start + 1)) {
        hits.push({ node, term, start, end: start + term.length });
      }
      return hits;
    }));
  // Suppress only the parent mention inside a longer branch name. A separate
  // parent mention in the same question must retain its own direct connections.
  const nodes = [...new Map(nodeMatches.filter(hit => !nodeMatches.some(other => other.node.graphNodeId !== hit.node.graphNodeId
    && other.term.length > hit.term.length && other.start <= hit.start && other.end >= hit.end))
    .map(hit => [hit.node.graphNodeId, hit.node])).values()];
  const spatial = /\b(near|nearby|nearest|closest|above|below|adjacent|surrounding|distance|next to|within \d)\b/.test(normalized)
    || /\b(anterior|posterior|medial|lateral|proximal|distal|superficial|deep|dorsal|palmar|volar)\s+(to|of)\b/.test(normalized);
  let relationshipType: AnatomyRelationship['type'] | undefined;
  const supplyQuestion = /\b(supply|supplies|supplied)\b/.test(normalized);
  const nerveSupply = supplyQuestion && /\b(nerve|neural|nervous)\b/.test(normalized)
    && !/\b(artery|arteries|blood|vascular)\b/.test(normalized);
  if (/\b(innervate|innervates|innervated|innervation)\b/.test(normalized)
    || nerveSupply) relationshipType = 'INNERVATES';
  else if (/\b(supply|supplies|supplied|blood supply)\b/.test(normalized)) relationshipType = 'SUPPLIES';
  else if (/\b(origin|origins|originate|originates)\b/.test(normalized)) relationshipType = 'ORIGINATES_ON';
  else if (/\b(insert|inserts|insertion|insertions)\b/.test(normalized)) relationshipType = 'INSERTS_ON';
  else if (/\b(articulate|articulates|articulation|articulations)\b/.test(normalized)) relationshipType = 'ARTICULATES_WITH';
  else if (/\b(drain|drains|drainage)\b/.test(normalized)) relationshipType = 'DRAINS_TO';
  else if (/\b(attach|attaches|attachment|attachments)\b/.test(normalized)) relationshipType = 'ATTACHES_TO';
  else if (/\b(pass through|passes through|traverse|traverses)\b/.test(normalized)) relationshipType = 'PASSES_THROUGH';
  else if (/\b(branches from|branch from|branches of)\b/.test(normalized)) relationshipType = 'BRANCHES_FROM';
  else if (/\b(part of|parts of)\b/.test(normalized)) relationshipType = 'PART_OF';
  else if (/\b(continues as|continue as|continuation of)\b/.test(normalized)) relationshipType = 'CONTINUES_AS';
  else if (/\b(communicates with|communicate with|communication with)\b/.test(normalized)) relationshipType = 'COMMUNICATES_WITH';
  else if (/\b(joint|joints)\b/.test(normalized)) relationshipType = 'ARTICULATES_WITH';
  // A condition alias can also name anatomy ("carpal tunnel"). An explicit
  // relationship request uses that anatomical entry unless clinical wording is present.
  const clinical = /\b(syndrome|disease|condition|affected|pain|injury|disorder|symptom|symptoms|cts)\b/.test(normalized)
    || (conditions.length > 0 && !relationshipType);
  const intent: RetrievalIntent = spatial ? 'SPATIAL_QUERY' : clinical ? 'CLINICAL_CONDITION_QUERY' : 'ANATOMY_RELATIONSHIP_QUERY';
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
    message: spatial ? 'Spatial retrieval is not implemented. Graph relationships do not establish physical proximity.' : evidence.length ? `Found ${evidence.length} direct cited relationship${evidence.length === 1 ? '' : 's'} in the hand dataset.${matches.length > evidence.length ? ' Showing the first 20; use a more specific structure or branch name for the remaining matches.' : ''} Follow named branches in the graph for their connections.` : 'No direct cited relationships matched this query. Try a specific structure or branch, such as Abductor Pollicis Brevis, the recurrent branch of the median nerve, or Scaphoid.',
    extractedTerms: [...nodes.map((node) => node.name), ...(clinical ? conditions.map((condition) => condition.name) : [])], evidence,
    metadata: { timestamp: new Date().toISOString(), totalEvidences: evidence.length, version: dataset.metadata.version, mode: dataset.mode, graphragStage: 'Deterministic entity matching and one-hop curated graph retrieval; no vector search or generated medical answer', truncated: matches.length > evidence.length },
  };
}
