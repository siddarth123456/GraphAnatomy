'use client';


import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { GraphData } from '@/types/graph';
import { HighlightState, RegionManifest } from '@/types/anatomy';
import { gql, useApolloClient } from '@apollo/client';
import { transformNeo4jToGraph } from '../utils/GraphAdapter';

const ForceGraphRenderer = dynamic(
  () => import('./ForceGraphRenderer'),
  { ssr: false, loading: () => <div className="text-gray-400">Loading Engine...</div> }
);

interface KnowledgeGraphViewProps {
  data: GraphData; // Used as fallback
  engine?: 'force-graph' | 'cytoscape' | 'webgpu';
}

const GET_NODE_ASSET = gql`
  query GetNodeAsset($graphNodeId: ID!) {
    anatomicalStructures(where: { graphNodeId: { eq: $graphNodeId } }) {
      asset {
        meshId
      }
    }
  }
`;

const HEALTH_CHECK = gql`
  query HealthCheck {
    anatomicalStructures(limit: 1) {
      name
    }
  }
`;

const GET_FULL_GRAPH = gql`
  query GetFullGraph {
    anatomicalStructures {
      graphNodeId
      name
      system {
        name
      }
      asset {
        meshId
      }
      innervates {
        graphNodeId
      }
      supplies {
        graphNodeId
      }
    }
  }
`;

export function KnowledgeGraphView({ data: fallbackData, engine = 'force-graph' }: KnowledgeGraphViewProps) {
  const selectAnatomy = useAppStore(state => state.selectAnatomy);
  const activeGraphNodeId = useAppStore(state => state.activeGraphNodeId);
  const [manifest, setManifest] = useState<RegionManifest | null>(null);
  const client = useApolloClient();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [graphStatus, setGraphStatus] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [usingFallback, setUsingFallback] = useState(false);

  const USE_REMOTE_GRAPH = process.env.NEXT_PUBLIC_USE_REMOTE_GRAPH === 'true';

  useEffect(() => {
    fetch('/manifests/hand_region.json')
      .then(res => res.json())
      .then(data => setManifest(data));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeGraph() {
      if (!USE_REMOTE_GRAPH) {
        if (isMounted) {
          setGraphData(fallbackData);
          setUsingFallback(true);
          setGraphStatus('READY');
        }
        return;
      }

      try {
        // 1. Health Check
        const { data: healthData, error: healthError } = await client.query({
          query: HEALTH_CHECK,
          fetchPolicy: 'network-only'
        });

        if (healthError || !healthData?.anatomicalStructures?.length) {
          throw new Error('Neo4j Database unreachable or empty');
        }

        // 2. Fetch Full Graph
        const { data: fullData } = await client.query({
          query: GET_FULL_GRAPH,
          fetchPolicy: 'network-only'
        });

        console.log("Neo4j Full Graph Data Response:", fullData);

        // 3. Transform
        const transformedGraph = transformNeo4jToGraph(fullData.anatomicalStructures);
        console.log("Transformed Graph Adapter output:", transformedGraph);
        if (isMounted) {
          setGraphData(transformedGraph);
          setGraphStatus('READY');
        }
      } catch (err) {
        console.error("⚠️ Failed to load Neo4j Graph. Falling back to Mock Data.", err);
        if (isMounted) {
          setGraphData(fallbackData);
          setUsingFallback(true);
          setGraphStatus('READY');
        }
      }
    }

    initializeGraph();
    return () => { isMounted = false; };
  }, [client, fallbackData, USE_REMOTE_GRAPH]);

  const handleNodeClick = React.useCallback(async (nodeId: string, fallbackMeshId?: string) => {
    let targetMeshId = fallbackMeshId;

    if (USE_REMOTE_GRAPH) {
      try {
        const { data } = await client.query({
          query: GET_NODE_ASSET,
          variables: { graphNodeId: nodeId },
          fetchPolicy: 'network-only'
        });

        const resolvedMeshId = data?.anatomicalStructures?.[0]?.asset?.meshId;
        if (resolvedMeshId) {
          console.log("✅ Neo4j Resolves:", resolvedMeshId);
          targetMeshId = resolvedMeshId;
        }
      } catch (err) {
        console.warn("⚠️ Asset Resolution Failed over Neo4j", err);
      }
    }

    if (targetMeshId && manifest) {
      const targetNode = manifest.meshes.find(m => m.meshId === targetMeshId);
      if (targetNode) {
        selectAnatomy(targetNode);
      }
    }
  }, [client, USE_REMOTE_GRAPH, manifest, selectAnatomy]);

  useEffect(() => {
    if (activeGraphNodeId) {
      setHighlightedNodes(new Set([activeGraphNodeId]));
    } else {
      setHighlightedNodes(prev => prev.size === 0 ? prev : new Set());
    }
  }, [activeGraphNodeId]);

  if (graphStatus === 'LOADING' || !graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">Loading Medical Knowledge Graph...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {usingFallback && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-md text-sm border border-yellow-500/50">
          ⚠️ Using Fallback Graph
        </div>
      )}
      {engine === 'force-graph' && (
        <ForceGraphRenderer
          data={graphData}
          onNodeClick={handleNodeClick}
          highlightedNodes={highlightedNodes}
        />
      )}
    </div>
  );
}
