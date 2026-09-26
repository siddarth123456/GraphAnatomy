import { getAnatomyDataset } from '@/lib/anatomy-repository';
import { AnatomyDataError } from '@/lib/neo4j';
import { retrieveEvidence } from '@/lib/retrieval';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const query = body && typeof body === 'object' && 'query' in body ? body.query : undefined;
  if (typeof query !== 'string' || !query.trim() || query.trim().length > 500) {
    return Response.json({ error: 'query must be a nonempty string of at most 500 characters.' }, { status: 400 });
  }
  try { return Response.json(retrieveEvidence(query.trim(), await getAnatomyDataset())); }
  catch (error) { return Response.json({ error: error instanceof AnatomyDataError ? error.message : 'Retrieval is temporarily unavailable.' }, { status: 503 }); }
}
