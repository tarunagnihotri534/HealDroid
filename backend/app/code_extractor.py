from pathlib import Path
from typing import Iterator, Dict, Any, Optional

class CodeExtractor:
    """
    Normalized code extraction layer for decompiled Android sources.
    Exposes decompiled Java files as a streaming generator to keep memory usage low.
    This module encapsulates the disk layout of decompiled files.
    """
    def __init__(self, decompiled_dir: Path | str):
        self.decompiled_dir = Path(decompiled_dir)
        
        # Sources might be directly in decompiled_dir, or under decompiled_dir/sources
        if (self.decompiled_dir / "sources").is_dir():
            self.source_root = self.decompiled_dir / "sources"
        else:
            self.source_root = self.decompiled_dir

    def iter_files(self, exclude_packages: Optional[list[str]] = None) -> Iterator[Dict[str, Any]]:
        """
        Yields { "file_path": str, "relative_path": str, "content": str }
        one file at a time.
        """
        if not self.source_root.exists():
            return

        excludes = exclude_packages or []

        for p in self.source_root.rglob("*.java"):
            if not p.is_file():
                continue
                
            try:
                rel_path = str(p.relative_to(self.source_root)).replace("\\", "/")
            except ValueError:
                rel_path = p.name

            # Optional filter for noise packages (e.g. androidx, android/support)
            if any(rel_path.startswith(exc) for exc in excludes):
                continue

            try:
                with open(p, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception:
                continue

            yield {
                "file_path": str(p),
                "relative_path": rel_path,
                "content": content
            }

    def count_files(self) -> int:
        """Returns the total number of java files available."""
        if not self.source_root.exists():
            return 0
        return sum(1 for p in self.source_root.rglob("*.java") if p.is_file())

def extract_code_files(decompiled_dir: Path | str) -> Iterator[Dict[str, Any]]:
    """Convenience generator function."""
    extractor = CodeExtractor(decompiled_dir)
    return extractor.iter_files()
