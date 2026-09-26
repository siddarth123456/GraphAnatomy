export const typeDefs = `#graphql
  type Citation { title: String!, url: String! }
  type AnatomyAsset { meshId: String!, glbPath: String!, manifestPath: String!, sourceDataset: String!, sourceVersion: String! }
  type System { id: ID!, name: String! }
  type AnatomicalStructure {
    graphNodeId: ID!, name: String!, fmaId: String, snomedId: String, ontologyValidated: Boolean!
    category: String!, searchableTerms: [String!]!, description: String!, citation: Citation
    asset: AnatomyAsset, system: System!
    relationships: [AnatomyRelationship!]!
    innervates: [AnatomicalStructure!]!, innervatedBy: [AnatomicalStructure!]!
    supplies: [AnatomicalStructure!]!, suppliedBy: [AnatomicalStructure!]!
    articulatesWith: [AnatomicalStructure!]!, originatesOn: [AnatomicalStructure!]!, insertsOn: [AnatomicalStructure!]!
    clinicalConditions: [ClinicalCondition!]!
  }
  type ClinicalCondition { id: ID!, name: String!, synonyms: [String!]!, description: String!, citation: Citation!, affectedStructures: [AnatomicalStructure!]! }
  enum RelationshipType { ARTICULATES_WITH INNERVATES SUPPLIES ORIGINATES_ON INSERTS_ON AFFECTED_BY }
  type AnatomyRelationship { id: ID!, source: ID!, target: ID!, type: RelationshipType!, description: String!, citation: Citation! }
  type DatasetMetadata { datasetId: String!, version: String!, structureCount: Int!, renderableCount: Int!, relationshipCount: Int!, ontologyStatus: String!, scope: String! }
  type AnatomyGraph { mode: String!, structures: [AnatomicalStructure!]!, clinicalConditions: [ClinicalCondition!]!, relationships: [AnatomyRelationship!]!, metadata: DatasetMetadata! }
  input AnatomicalStructureWhere { graphNodeId: ID, name_CONTAINS: String, category: String, fmaId: String }
  input RelationshipWhere { source: ID, target: ID, type: RelationshipType }
  input ClinicalConditionWhere { id: ID, name_CONTAINS: String }
  type Query {
    anatomyGraph: AnatomyGraph!
    anatomicalStructures(where: AnatomicalStructureWhere, limit: Int): [AnatomicalStructure!]!
    anatomicalStructure(graphNodeId: ID!): AnatomicalStructure
    anatomyAssets(meshId: String, limit: Int): [AnatomyAsset!]!
    anatomyRelationships(where: RelationshipWhere, limit: Int): [AnatomyRelationship!]!
    clinicalConditions(where: ClinicalConditionWhere, limit: Int): [ClinicalCondition!]!
  }
`;
