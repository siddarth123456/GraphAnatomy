"""Compatibility entry point; the JavaScript CLI owns the canonical indexes."""
from pathlib import Path
import subprocess
import sys

if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    sys.exit(subprocess.call(["node", str(root / "scripts" / "01_create_indexes.js")], cwd=root))
