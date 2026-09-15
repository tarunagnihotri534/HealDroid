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
        Yields { "file_path": str, "relative_path": str, "file_type": "java" | "smali", "content": str }
        one file at a time across both decompiled Java and Smali trees.
        """
        if not self.decompiled_dir.exists():
            return

        excludes = exclude_packages or []
        seen_paths = set()

        # Search roots: source_root (sources or decompiled_dir), and any smali directory
        search_roots = [self.source_root]
        smali_dir = self.decompiled_dir / "smali"
        if smali_dir.is_dir() and smali_dir not in search_roots:
            search_roots.append(smali_dir)

        for root in search_roots:
            if not root.exists():
                continue
            for p in root.rglob("*"):
                if not p.is_file():
                    continue
                ext = p.suffix.lower()
                if ext not in (".java", ".smali"):
                    continue

                if p in seen_paths:
                    continue
                seen_paths.add(p)
                    
                try:
                    rel_path = str(p.relative_to(root)).replace("\\", "/")
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
                    "file_type": "smali" if ext == ".smali" else "java",
                    "content": content
                }

    def count_files(self) -> int:
        """Returns the total number of java and smali files available."""
        if not self.decompiled_dir.exists():
            return 0
        seen = set()
        count = 0
        search_roots = [self.source_root]
        smali_dir = self.decompiled_dir / "smali"
        if smali_dir.is_dir() and smali_dir not in search_roots:
            search_roots.append(smali_dir)

        for root in search_roots:
            if not root.exists():
                continue
            for p in root.rglob("*"):
                if p.is_file() and p.suffix.lower() in (".java", ".smali") and p not in seen:
                    seen.add(p)
                    count += 1
        return count

def extract_code_files(decompiled_dir: Path | str) -> Iterator[Dict[str, Any]]:
    """Convenience generator function."""
    extractor = CodeExtractor(decompiled_dir)
    return extractor.iter_files()

