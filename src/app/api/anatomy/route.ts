import { getAnatomyDataset } from '@/lib/anatomy-repository';
import { AnatomyDataError } from '@/lib/neo4j';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { return Response.json(await getAnatomyDataset()); }
  catch (error) { return Response.json({ error: error instanceof AnatomyDataError ? error.message : 'The anatomy dataset is unavailable.' }, { status: 503 }); }
}
