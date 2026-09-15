import os
from pathlib import Path
from typing import Iterator, Dict, Any, Optional

DEFAULT_EXCLUDE_PACKAGES = [
    "androidx/",
    "android/support/",
    "kotlin/",
    "kotlinx/",
    "j$/",
    "java/",
    "javax/",
    "org/bouncycastle/",
    "com/google/protobuf/",
]

DEFAULT_EXCLUDE_DIR_NAMES = {
    "androidx",
    "kotlin",
    "kotlinx",
    "j$",
    "bouncycastle",
    "protobuf",
}

VENDOR_SDK_EXCLUDES = [
    "com/google/",
    "com/facebook/",
    "com/inmobi/",
    "com/squareup/okhttp/",
    "okhttp3/",
    "io/reactivex/",
    "retrofit2/",
]


class CodeExtractor:
    """
    Normalized code extraction layer for decompiled Android sources.
    Exposes decompiled Java and Smali files as a streaming generator to keep memory usage low.
    Encapsulates the disk layout of decompiled files and filters standard framework noise.
    """
    def __init__(self, decompiled_dir: Path | str):
        self.decompiled_dir = Path(decompiled_dir)
        
        # Sources might be directly in decompiled_dir, or under decompiled_dir/sources
        if (self.decompiled_dir / "sources").is_dir():
            self.source_root = self.decompiled_dir / "sources"
        else:
            self.source_root = self.decompiled_dir

    def iter_files(
        self, 
        exclude_packages: Optional[list[str]] = None,
        max_files: int = 3000
    ) -> Iterator[Dict[str, Any]]:
        """
        Yields { "file_path": str, "relative_path": str, "file_type": "java" | "smali", "content": str }
        one file at a time across both decompiled Java and Smali trees.
        Filters out framework/runtime noise packages by default.
        """
        if not self.decompiled_dir.exists():
            return

        excludes = exclude_packages if exclude_packages is not None else DEFAULT_EXCLUDE_PACKAGES
        seen_paths = set()
        yielded_count = 0

        # Search roots: source_root (sources or decompiled_dir), and any smali directory
        search_roots = [self.source_root]
        smali_dir = self.decompiled_dir / "smali"
        if smali_dir.is_dir() and smali_dir not in search_roots:
            search_roots.append(smali_dir)

        for root in search_roots:
            if not root.exists():
                continue
            root_str = str(root)
            for dirpath, dirnames, filenames in os.walk(root_str):
                # Prune directory search in-place for massive performance gain
                dirnames[:] = [d for d in dirnames if d not in DEFAULT_EXCLUDE_DIR_NAMES]
                for filename in filenames:
                    if yielded_count >= max_files:
                        return
                    ext = os.path.splitext(filename)[1].lower()
                    if ext not in (".java", ".smali"):
                        continue

                    full_path = os.path.join(dirpath, filename)
                    if full_path in seen_paths:
                        continue
                    seen_paths.add(full_path)
                        
                    try:
                        rel_path = os.path.relpath(full_path, root_str).replace("\\", "/")
                    except ValueError:
                        rel_path = filename

                    # Filter noise packages (e.g. androidx, android/support, j$/)
                    if any(rel_path.startswith(exc) for exc in excludes):
                        continue

                    try:
                        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                            content = f.read()
                    except Exception:
                        continue

                    yielded_count += 1
                    yield {
                        "file_path": full_path,
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
            for dirpath, _, filenames in os.walk(str(root)):
                for filename in filenames:
                    ext = os.path.splitext(filename)[1].lower()
                    if ext in (".java", ".smali"):
                        full_path = os.path.join(dirpath, filename)
                        if full_path not in seen:
                            seen.add(full_path)
                            count += 1
        return count

def extract_code_files(
    decompiled_dir: Path | str,
    target_package: Optional[str] = None,
    scan_mode: str = "deep"
) -> Iterator[Dict[str, Any]]:
    """Convenience generator function supporting scan profiles."""
    extractor = CodeExtractor(decompiled_dir)
    if scan_mode == "standard":
        excludes = list(DEFAULT_EXCLUDE_PACKAGES)
        pkg_prefix = target_package.replace(".", "/") + "/" if target_package else ""
        for v in VENDOR_SDK_EXCLUDES:
            if not pkg_prefix or not pkg_prefix.startswith(v):
                excludes.append(v)
        return extractor.iter_files(exclude_packages=excludes, max_files=1000)
    else:
        return extractor.iter_files(max_files=3000)

