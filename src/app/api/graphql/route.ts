import { buildSchema, execute, getOperationAST, GraphQLError, parse, validate, visit } from 'graphql';
import { typeDefs } from '@/graphql/typeDefs';
import { createGraphResolvers } from '@/graphql/resolvers';
import { getAnatomyDataset } from '@/lib/anatomy-repository';
import { AnatomyDataError } from '@/lib/neo4j';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = buildSchema(typeDefs);
const badRequest = (message: string) => Response.json({ errors: [{ message }] }, { status: 400 });

async function handle(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return badRequest('Expected a GraphQL request object.');
  const { query, variables, operationName } = payload as Record<string, unknown>;
  if (typeof query !== 'string' || !query.trim() || query.length > 10000) return badRequest('query must be a nonempty GraphQL document of at most 10000 characters.');
  if (variables != null && (typeof variables !== 'object' || Array.isArray(variables))) return badRequest('variables must be an object.');
  if (operationName != null && typeof operationName !== 'string') return badRequest('operationName must be a string.');
  let document;
  try { document = parse(query); } catch { return badRequest('GraphQL syntax is invalid.'); }
  const errors = validate(schema, document);
  if (errors.length) return Response.json({ errors }, { status: 400 });
  const operation = getOperationAST(document, operationName as string | undefined);
  if (!operation || operation.operation !== 'query') return badRequest('This API accepts read-only queries only.');
  let fields = 0;
  let depth = 0;
  let maxDepth = 0;
  visit(document, { Field: { enter() { fields++; depth++; maxDepth = Math.max(maxDepth, depth); }, leave() { depth--; } } });
  if (fields > 200 || maxDepth > 10) return badRequest('Query exceeds the supported size or nesting depth.');
  // Fragments can multiply the evaluated tree; the small MVP API keeps query costs explicit.
  let hasFragment = false;
  visit(document, { FragmentSpread() { hasFragment = true; } });
  if (hasFragment) return badRequest('Fragment spreads are not supported by this bounded MVP API. Use inline fields.');
  try {
    const dataset = await getAnatomyDataset();
    const result = await execute({ schema, document, rootValue: createGraphResolvers(dataset), variableValues: variables as Record<string, unknown> | undefined, operationName: operationName as string | undefined });
    return Response.json(result, { status: result.errors && !result.data ? 400 : 200 });
  } catch (error) {
    const message = error instanceof AnatomyDataError ? error.message : 'The anatomy graph is unavailable.';
    return Response.json({ errors: [new GraphQLError(message)] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try { return handle(await request.json()); } catch { return badRequest('Request body must be valid JSON.'); }
}
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try { return handle({ query: params.get('query'), operationName: params.get('operationName') ?? undefined, variables: params.has('variables') ? JSON.parse(params.get('variables')!) : undefined }); }
  catch { return badRequest('variables must contain valid JSON.'); }
}
