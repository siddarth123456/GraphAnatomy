import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { useAppStore } from '../src/store/useAppStore';
import { AnatomyLayer, AnatomySceneNode, HighlightState } from '../src/types/anatomy';
import { getExplosionOffset, getNodeBounds } from '../src/features/anatomy-viewer/models/MeshRegistry';

const bone: AnatomySceneNode = {
  meshId: 'mesh_scaphoid', graphNodeId: 'BONE_SCAPHOID', name: 'Scaphoid',
  category: 'Bone', system: 'Skeletal', materialId: 'mat_bone', layer: AnatomyLayer.Bone,
  lod: { high: '/models/scaphoid.glb', medium: '/models/scaphoid.glb', low: '/models/scaphoid.glb' },
  boundingBox: [1, 2, 3, 3, 4, 5], position: [2, 3, 4], explosionDirection: [0, 0, 0],
  searchableTerms: ['scaphoid'], clinicalTags: [],
};
const artery: AnatomySceneNode = {
  ...bone, meshId: 'mesh_radial_artery', graphNodeId: 'ARTERY_RADIAL', name: 'Radial Artery',
  layer: AnatomyLayer.Artery, explosionDirection: [1, 0, 0],
};

beforeEach(() => { useAppStore.setState(useAppStore.getInitialState(), true); });

test('searching a hidden structure reveals its layer and targets its world bounds', () => {
  useAppStore.getState().setLayers([AnatomyLayer.Bone]);
  useAppStore.getState().selectAnatomy(artery);
  const state = useAppStore.getState();
  assert.equal(state.selectedMeshId, artery.meshId);
  assert.equal(state.activeGraphNodeId, artery.graphNodeId);
  assert.equal(state.activePreset, 'CUSTOM');
  assert.ok(state.activeLayers.includes(AnatomyLayer.Artery));
  assert.deepEqual(state.cameraTargetBox, artery.boundingBox);
  assert.notEqual(state.cameraTargetBox, artery.boundingBox);
});

test('selection replaces only the previous selection and keeps other highlight roles', () => {
  useAppStore.getState().setMeshHighlight('quiz', HighlightState.QuizTarget);
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setHoveredMeshId(artery.meshId);
  assert.equal(useAppStore.getState().meshHighlightStates[bone.meshId], HighlightState.Selected);
  useAppStore.getState().selectAnatomy(artery);
  const state = useAppStore.getState();
  assert.equal(state.hoveredMeshId, null);
  assert.equal(state.meshHighlightStates[bone.meshId], undefined);
  assert.equal(state.meshHighlightStates[artery.meshId], HighlightState.Selected);
  assert.equal(state.meshHighlightStates.quiz, HighlightState.QuizTarget);
});

test('hiding the selected layer clears invisible selection and isolation', () => {
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setIsolationMode(true);
  useAppStore.getState().toggleLayer(AnatomyLayer.Bone);
  const state = useAppStore.getState();
  assert.equal(state.selectedMeshId, null);
  assert.equal(state.activeMeshNode, null);
  assert.equal(state.activeGraphNodeId, null);
  assert.equal(state.cameraTargetBox, null);
  assert.equal(state.isolationMode, false);
  assert.equal(state.meshHighlightStates[bone.meshId], undefined);
});

test('presets clear a hidden selection but preserve selection in an included layer', () => {
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setLayers([AnatomyLayer.Bone]);
  assert.equal(useAppStore.getState().selectedMeshId, bone.meshId);
  useAppStore.getState().setLayers([AnatomyLayer.Artery]);
  assert.equal(useAppStore.getState().selectedMeshId, null);
});

test('isolation requires a selected structure and clearing selection exits isolation', () => {
  useAppStore.getState().setIsolationMode(true);
  assert.equal(useAppStore.getState().isolationMode, false);
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setIsolationMode(true);
  assert.equal(useAppStore.getState().isolationMode, true);
  useAppStore.getState().clearSelection();
  assert.equal(useAppStore.getState().isolationMode, false);
});

test('graph-only selection does not leave stale mesh focus or isolation', () => {
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setIsolationMode(true);
  useAppStore.getState().selectGraphNode('NERVE_MEDIAN');
  const state = useAppStore.getState();
  assert.equal(state.activeGraphNodeId, 'NERVE_MEDIAN');
  assert.equal(state.activeMeshNode, null);
  assert.equal(state.selectedMeshId, null);
  assert.equal(state.cameraTargetBox, null);
  assert.equal(state.isolationMode, false);
  assert.equal(state.meshHighlightStates[bone.meshId], undefined);
});

test('reset restores the complete hand view and emits a fresh camera reset', () => {
  useAppStore.getState().setLayers([AnatomyLayer.Bone]);
  useAppStore.getState().selectAnatomy(bone);
  useAppStore.getState().setHoveredMeshId(artery.meshId);
  useAppStore.getState().setIsolationMode(true);
  useAppStore.getState().setExplosionAmount(1.5);
  useAppStore.getState().setClippingState({ enabled: true, plane: 'sagittal', position: 0.2 });
  const resetKey = useAppStore.getState().viewResetKey;
  useAppStore.getState().resetView();
  const state = useAppStore.getState();
  assert.deepEqual(state.activeLayers, Object.values(AnatomyLayer));
  assert.equal(state.activePreset, 'EDUCATIONAL');
  assert.equal(state.explosionAmount, 0);
  assert.deepEqual(state.clippingState, { enabled: false, plane: 'axial', position: 0 });
  assert.equal(state.isolationMode, false);
  assert.equal(state.selectedMeshId, null);
  assert.equal(state.activeGraphNodeId, null);
  assert.equal(state.hoveredMeshId, null);
  assert.deepEqual(state.meshHighlightStates, {});
  assert.equal(state.viewResetKey, resetKey + 1);
  useAppStore.getState().resetView();
  assert.equal(useAppStore.getState().viewResetKey, resetKey + 2);
});

test('invalid mode inputs cannot create non-finite transforms or slicing planes', () => {
  for (const [input, expected] of [[-1, 0], [3, 2], [NaN, 0], [Infinity, 0], [1.2, 1.2]]) {
    useAppStore.getState().setExplosionAmount(input);
    assert.equal(useAppStore.getState().explosionAmount, expected);
  }
  useAppStore.getState().setClippingState({ position: 0.5 });
  useAppStore.getState().setClippingState({ position: NaN });
  assert.equal(useAppStore.getState().clippingState.position, 0.5);
});

test('explosion provides a deterministic nonzero fallback for zero-vector manifests', () => {
  const offset = getExplosionOffset(bone, 1.5);
  assert.ok(Math.abs(Math.hypot(...offset) - 1.5) < 1e-12);
  assert.deepEqual(getExplosionOffset(bone, 1.5), offset);
  assert.deepEqual(getExplosionOffset(bone, 0), [0, 0, 0]);
  assert.deepEqual(getExplosionOffset(artery, 1.5), [1.5, 0, 0]);
});

test('camera and labels use exploded world bounds without adding mesh position twice', () => {
  assert.deepEqual(getNodeBounds(artery, 0), artery.boundingBox);
  assert.deepEqual(getNodeBounds(artery, 1.5), [2.5, 2, 3, 4.5, 4, 5]);
  const offset = getExplosionOffset(bone, 1);
  const bounds = getNodeBounds(bone, 1);
  for (let axis = 0; axis < 3; axis++) {
    assert.ok(Math.abs(bounds[axis] - bone.boundingBox[axis] - offset[axis]) < 1e-12);
    assert.ok(Math.abs(bounds[axis + 3] - bounds[axis] - (bone.boundingBox[axis + 3] - bone.boundingBox[axis])) < 1e-12);
  }
});
