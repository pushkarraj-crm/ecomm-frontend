"""Package a completed static export, including Apache's hidden config files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

project = Path(__file__).resolve().parent.parent
export = project / "out"
if not (export / "index.html").is_file() or not (export / ".htaccess").is_file():
    raise SystemExit("Run npm run build successfully before packaging.")
target = project / "shared-hosting.zip"
with ZipFile(target, "w", ZIP_DEFLATED, compresslevel=1) as archive:
    for file in sorted(export.rglob("*")):
        if file.is_file():
            archive.write(file, file.relative_to(export).as_posix())
with ZipFile(target) as archive:
    assert "index.html" in archive.namelist()
    assert ".htaccess" in archive.namelist()
    assert "_next/.htaccess" in archive.namelist()
print(f"Created {target.name} ({target.stat().st_size / 1024 / 1024:.1f} MB)")
