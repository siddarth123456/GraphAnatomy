"""Run with Blender Python (bundled NumPy/mathutils); inputs use Three FBX world coordinates."""
import json
import sys
from pathlib import Path
import numpy as np
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
directory = Path(args[0] if args else 'output/hand-expansion/z-anatomy')
initial = json.loads(Path('scripts/assets/z-anatomy-registration.json').read_text())
pairs = initial['landmarks']
a = np.array([p['sourceCenter'] for p in pairs])
b = np.array([p['targetCenter'] for p in pairs])

def fit(source, target):
    ca = source - source.mean(0)
    cb = target - target.mean(0)
    u, singular, vt = np.linalg.svd(ca.T @ cb)
    correction = np.eye(3)
    correction[-1, -1] = np.linalg.det(vt.T @ u.T)
    rotation = vt.T @ correction @ u.T
    scale = (singular * np.diag(correction)).sum() / (ca * ca).sum()
    matrix = np.eye(4)
    matrix[:3, :3] = scale * rotation
    matrix[:3, 3] = target.mean(0) - matrix[:3, :3] @ source.mean(0)
    return matrix

def distances(source, target):
    vertices = np.array(target['vertices']).reshape(-1, 3)
    triangles = np.array(target['indices']).reshape(-1, 3)
    tree = BVHTree.FromPolygons(vertices.tolist(), triangles.tolist(), all_triangles=True)
    return np.array([tree.find_nearest(vertex.tolist())[3] for vertex in source])

def summary(values):
    return {'rmsMm': float(np.sqrt(np.mean(values ** 2))), 'meanMm': float(values.mean()), 'p95Mm': float(np.percentile(values, 95)), 'maxMm': float(values.max())}

# A deterministic split spans forearm, carpal rows, metacarpals and digit tips.
training = np.arange(0, len(pairs), 2)
held_out = np.arange(1, len(pairs), 2)
split_matrix = fit(a[training], b[training])
held_residuals = np.linalg.norm(a[held_out] @ split_matrix[:3, :3].T + split_matrix[:3, 3] - b[held_out], axis=1)
matrix = np.array(initial['matrixRowMajor'])
surfaces = []
all_distances = []
for item in json.loads((directory / 'registration-surfaces.json').read_text()):
    source_vertices = np.array(item['donor']['vertices']).reshape(-1, 3)
    transformed = source_vertices @ matrix[:3, :3].T + matrix[:3, 3]
    target_vertices = np.array(item['target']['vertices']).reshape(-1, 3)
    forward = distances(transformed, item['target'])
    backward = distances(target_vertices, {'vertices': transformed.flatten().tolist(), 'indices': item['donor']['indices']})
    errors = np.concatenate([forward, backward])
    surfaces.append({'graphNodeId': item['graphNodeId'], 'sourceObject': item['sourceObject'], 'donorVertices': len(source_vertices), 'targetVertices': len(target_vertices), **summary(errors)})
    all_distances.append(errors)
surface_summary = summary(np.concatenate(all_distances))
passed = float(held_residuals.max()) < 2 and surface_summary['p95Mm'] < 2 and surface_summary['rmsMm'] < 1
result = {
    'id': 'z-anatomy-to-bodyparts3d-right-hand-2026-09-26-v1',
    'method': 'Orientation-preserving similarity fit from 29 corresponding right bone bounding-box centers; independently checked by a deterministic held-out split and bidirectional vertex-to-triangle surface distances.',
    'matrixConvention': 'column-major; maps Three.js FBXLoader world coordinates to BodyParts3D source millimeters',
    'matrix': matrix.T.flatten().tolist(), 'matrixRowMajor': matrix.tolist(),
    'rmseMm': initial['rmseMm'], 'maxResidualMm': initial['maxResidualMm'], 'landmarks': pairs,
    'heldOut': {'trainingCount': len(training), 'testCount': len(held_out), 'trainingGraphNodeIds': [pairs[i]['graphNodeId'] for i in training], 'matrixRowMajor': split_matrix.tolist(), **summary(held_residuals), 'landmarks': [{**pairs[i], 'heldOutResidualMm': float(error)} for i, error in zip(held_out, held_residuals)]},
    'surfaceVerification': {'method': 'Bidirectional distance from every decoded high-LOD target bone vertex to donor triangles and every donor vertex to target triangles; geometry is independent of the fitted bounding-box centers.', 'aggregate': surface_summary, 'bones': surfaces},
    'acceptance': {'passed': passed, 'heldOutMaxMmLimit': 2, 'surfaceRmsMmLimit': 1, 'surfaceP95MmLimit': 2},
    'limitations': 'One source atlas registration, not patient-specific or clinical accuracy certification. Small differences reflect source editions, decimation and approximate atlas alignment. No tissue-specific refitting is performed.',
}
(directory / 'registration-report.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'heldOut': summary(held_residuals), 'surfaces': surface_summary, 'passed': passed}, indent=2))
if not passed:
    raise RuntimeError('Registration did not meet declared tolerances')
