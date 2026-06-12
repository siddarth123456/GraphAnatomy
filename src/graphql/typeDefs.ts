export const typeDefs = `#graphql
  type AnatomyAsset @node {
    meshId: String!
    glbPath: String!
    manifestPath: String!
    sourceDataset: String!
    sourceVersion: String!
  }

  type AnatomicalStructure @node {
    graphNodeId: ID!
    fmaId: String
    snomedId: String
    name: String!
    searchableTerms: [String!]
    
    # Asset Resolution
    asset: AnatomyAsset @relationship(type: "HAS_ASSET", direction: OUT)
    
    # Structural Relationships
    system: System @relationship(type: "BELONGS_TO", direction: OUT)
    innervates: [AnatomicalStructure!]! @relationship(type: "INNERVATES", direction: OUT)
    supplies: [AnatomicalStructure!]! @relationship(type: "SUPPLIES", direction: OUT)
    partOf: [AnatomicalStructure!]! @relationship(type: "PART_OF", direction: OUT)
    parts: [AnatomicalStructure!]! @relationship(type: "PART_OF", direction: IN)
    
    # Clinical Relationships
    clinicalConditions: [ClinicalCondition!]! @relationship(type: "AFFECTED_BY", direction: OUT)
  }

  type System @node {
    id: ID!
    name: String!
    structures: [AnatomicalStructure!]! @relationship(type: "BELONGS_TO", direction: IN)
  }

  type ClinicalCondition @node {
    id: ID!
    name: String!
    synonyms: [String!]
    affectedStructures: [AnatomicalStructure!]! @relationship(type: "AFFECTED_BY", direction: IN)
  }
`;
