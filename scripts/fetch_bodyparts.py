#!/usr/bin/env python3
"""Fetch only selected OBJ members from the official BodyParts3D ZIP via HTTP ranges."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ARCHIVE_URL = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip'
ROOT = Path(__file__).resolve().parent.parent


class RemoteZip(io.RawIOBase):
    def __init__(self, url):
        self.url = url
        with urllib.request.urlopen(urllib.request.Request(url, method='HEAD'), timeout=60) as response:
            self.length = int(response.headers['Content-Length'])
            self.etag = response.headers.get('ETag')
        self.position = 0

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else self.length + offset
        if self.position < 0:
            raise ValueError('Negative archive offset')
        return self.position

    def tell(self):
        return self.position

    def read(self, count=-1):
        count = min(count if count >= 0 else self.length, self.length - self.position)
        if count <= 0:
            return b''
        headers = {'Range': f'bytes={self.position}-{self.position + count - 1}'}
        if self.etag:
            headers['If-Match'] = self.etag
        with urllib.request.urlopen(urllib.request.Request(self.url, headers=headers), timeout=60) as response:
            if response.status != 206:
                raise RuntimeError('Archive host did not honor HTTP Range; download the ZIP manually and use --archive')
            data = response.read()
        if len(data) != count:
            raise RuntimeError('Truncated archive range')
        self.position += len(data)
        return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path, help='Directory for OBJs and import-config.json')
    parser.add_argument('--mesh-id', action='append', help='Fetch only this manifest mesh (repeatable); default all')
    parser.add_argument('--archive', type=Path, help='Use an already downloaded official ZIP instead of HTTP ranges')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'public/manifests/hand_region.json').read_text())
    mappings = json.loads((ROOT / 'scripts/assets/bodyparts3d-mapping.json').read_text())['mappings']
    selected = [mesh for mesh in manifest['meshes'] if not args.mesh_id or mesh['meshId'] in args.mesh_id]
    if not selected or (args.mesh_id and len(selected) != len(set(args.mesh_id))):
        parser.error('Unknown or empty mesh selection')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    config = {'dataset': 'BodyParts3D', 'sourceVersion': '4.0', 'sourceUrl': ARCHIVE_URL,
              'regionId': manifest['regionId'], 'regionName': manifest['name'],
              'regionCentroid': manifest['regionCentroid'], 'coordinateScale': manifest['coordinateScale'], 'meshes': []}
    with zipfile.ZipFile(args.archive if args.archive else RemoteZip(ARCHIVE_URL)) as archive:
        names = archive.namelist()
        for mesh in selected:
            row = next(item for item in mappings if item['meshId'] == mesh['meshId'])
            source_name = row['sourceFile']
            members = [name for name in names if Path(name).name == source_name]
            if len(members) != 1:
                raise RuntimeError(f'Expected exactly one archive member: {source_name}')
            data = archive.read(members[0])  # zipfile verifies the member CRC.
            destination = output / source_name
            if destination.exists() and destination.read_bytes() != data:
                raise RuntimeError(f'Refusing to replace different source bytes: {destination}')
            destination.write_bytes(data)
            config['meshes'].append({**{key: mesh[key] for key in ['meshId', 'graphNodeId', 'fmaId', 'name', 'category', 'system', 'layer', 'materialId']},
                                     'sourceFile': source_name, 'sha256': hashlib.sha256(data).hexdigest()})
            print(f'{source_name}: {len(data):,} bytes', flush=True)
    (output / 'import-config.json').write_text(json.dumps(config, indent=2) + '\n')
    print(f'Import configuration: {output / "import-config.json"}')


if __name__ == '__main__':
    main()
