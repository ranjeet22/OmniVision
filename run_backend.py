import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SITE_PACKAGES = BASE_DIR / ".venv" / "Lib" / "site-packages"

if SITE_PACKAGES.exists():
    sys.path.insert(0, str(SITE_PACKAGES))

from app import app


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
