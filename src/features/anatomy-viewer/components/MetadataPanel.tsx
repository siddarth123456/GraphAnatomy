import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useQuery, gql } from '@apollo/client';
import { useRegionManager } from '@/hooks/useRegionManager';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { AnatomySceneNode } from '@/types/anatomy';

const GET_NODE_DETAILS = gql`
  query GetNodeDetails($id: ID!) {
    anatomicalStructures(where: { graphNodeId: $id }) {
      name
      fmaId
      snomedId
      partOf {
        graphNodeId
        name
        partOf {
          graphNodeId
          name
          partOf {
            graphNodeId
            name
          }
        }
      }
      innervates {
        graphNodeId
        name
      }
      supplies {
        graphNodeId
        name
      }
      clinicalConditions {
        name
        synonyms
      }
    }
  }
`;

export function MetadataPanel() {
  const activeMeshNode = useAppStore(state => state.activeMeshNode);
  const activeGraphNodeId = useAppStore(state => state.activeGraphNodeId);
  const clearSelection = useAppStore(state => state.clearSelection);
  const selectAnatomy = useAppStore(state => state.selectAnatomy);
  const learningMode = useAppStore(state => state.learningMode);
  
  const { meshes } = useRegionManager();
  
  const [activeTab, setActiveTab] = useState<'ANATOMY' | 'RELATIONS' | 'CLINICAL'>('ANATOMY');

  const { data, loading, error } = useQuery(GET_NODE_DETAILS, {
    variables: { id: activeGraphNodeId },
    skip: !activeGraphNodeId,
    fetchPolicy: 'cache-first'
  });

  if (!activeMeshNode) return null;

  const graphData = data?.anatomicalStructures?.[0];

  // Flattens the nested partOf hierarchy for breadcrumbs
  const getBreadcrumbs = () => {
    if (!graphData || !graphData.partOf || graphData.partOf.length === 0) return [];
    
    const crumbs = [];
    let current = graphData.partOf[0];
    crumbs.push(current);
    
    if (current.partOf && current.partOf.length > 0) {
      current = current.partOf[0];
      crumbs.unshift(current);
      
      if (current.partOf && current.partOf.length > 0) {
        current = current.partOf[0];
        crumbs.unshift(current);
      }
    }
    return crumbs;
  };

  const handleRelationshipClick = (graphNodeId: string) => {
    const targetMesh = meshes.find(m => m.graphNodeId === graphNodeId);
    if (targetMesh) {
      selectAnatomy(targetMesh);
    } else {
      console.warn('Mesh not loaded for graph node:', graphNodeId);
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="w-[400px] bg-gray-950/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh] pointer-events-auto">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeMeshNode.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono px-2 py-0.5 bg-gray-800 rounded text-blue-400">
                {activeMeshNode.system} SYSTEM
              </span>
              {graphData?.fmaId && (
                <span className="text-xs font-mono text-gray-500">
                  {graphData.fmaId}
                </span>
              )}
            </div>
          </div>
          <button onClick={clearSelection} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 transition-colors">
            ✕
          </button>
        </div>

        {/* BREADCRUMBS */}
        {breadcrumbs.length > 0 && learningMode !== 'BEGINNER' && (
          <div className="flex items-center flex-wrap gap-1 mt-3 text-xs text-gray-400 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.graphNodeId}>
                <button 
                  onClick={() => handleRelationshipClick(crumb.graphNodeId)}
                  className="hover:text-blue-400 transition-colors cursor-pointer flex items-center"
                >
                  {crumb.name}
                </button>
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </React.Fragment>
            ))}
            <span className="text-white">{activeMeshNode.name}</span>
          </div>
        )}
      </div>

      {/* TABS */}
      {(learningMode === 'INTERMEDIATE' || learningMode === 'ADVANCED') && (
        <div className="flex px-5 pt-3 space-x-4 border-b border-gray-800 text-sm font-medium">
          <button 
            className={`pb-3 ${activeTab === 'ANATOMY' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab('ANATOMY')}
          >
            Anatomy
          </button>
          <button 
            className={`pb-3 ${activeTab === 'RELATIONS' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab('RELATIONS')}
          >
            Relations
          </button>
          <button 
            className={`pb-3 ${activeTab === 'CLINICAL' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab('CLINICAL')}
          >
            Clinical
          </button>
        </div>
      )}

      {/* BODY CONTENT */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="h-4 bg-gray-800 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-md border border-red-900/50">
            Failed to load graph data.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ANATOMY TAB (Visible to all) */}
            {(activeTab === 'ANATOMY' || learningMode === 'BEGINNER') && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Description</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    The {activeMeshNode.name} is a key structure in the {activeMeshNode.system.toLowerCase()} system.
                    (GraphRAG text generation goes here. Currently relying on structured ontology data.)
                  </p>
                </div>
                
                {learningMode === 'ADVANCED' && graphData?.snomedId && (
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">SNOMED CT</h4>
                    <p className="text-sm font-mono text-gray-400">{graphData.snomedId}</p>
                  </div>
                )}
              </div>
            )}

            {/* RELATIONS TAB (Intermediate/Advanced) */}
            {activeTab === 'RELATIONS' && (
              <div className="space-y-5">
                {graphData?.innervates?.length > 0 && (
                  <div>
                    <h4 className="text-xs text-yellow-500/80 uppercase tracking-widest font-bold mb-2">Innervates</h4>
                    <ul className="space-y-1">
                      {graphData.innervates.map((item: any) => (
                        <li key={item.graphNodeId}>
                          <button 
                            onClick={() => handleRelationshipClick(item.graphNodeId)}
                            className="text-sm text-gray-300 hover:text-yellow-400 transition-colors flex items-center group w-full text-left p-1.5 -ml-1.5 rounded hover:bg-gray-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 mr-2 group-hover:bg-yellow-400"></span>
                            {item.name}
                            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {graphData?.supplies?.length > 0 && (
                  <div>
                    <h4 className="text-xs text-red-500/80 uppercase tracking-widest font-bold mb-2">Supplies</h4>
                    <ul className="space-y-1">
                      {graphData.supplies.map((item: any) => (
                        <li key={item.graphNodeId}>
                          <button 
                            onClick={() => handleRelationshipClick(item.graphNodeId)}
                            className="text-sm text-gray-300 hover:text-red-400 transition-colors flex items-center group w-full text-left p-1.5 -ml-1.5 rounded hover:bg-gray-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mr-2 group-hover:bg-red-400"></span>
                            {item.name}
                            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {graphData?.supplies?.length === 0 && graphData?.innervates?.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No structural downstream targets mapped.</p>
                )}
              </div>
            )}

            {/* CLINICAL TAB */}
            {activeTab === 'CLINICAL' && (
              <div className="space-y-4">
                {graphData?.clinicalConditions?.length > 0 ? (
                  graphData.clinicalConditions.map((cond: any) => (
                    <div key={cond.name} className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                      <h4 className="text-sm font-bold text-red-400 mb-1">{cond.name}</h4>
                      {cond.synonyms?.length > 0 && (
                        <p className="text-xs text-gray-500 mb-2">Also: {cond.synonyms.join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Clinical correlation linked to {activeMeshNode.name}. Future versions will feature full pathology details.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No direct clinical conditions mapped.</p>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
