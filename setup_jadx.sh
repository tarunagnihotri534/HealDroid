#!/usr/bin/env bash
set -e

VERSION="1.5.6"
ZIP_URL="https://github.com/skylot/jadx/releases/download/v${VERSION}/jadx-${VERSION}.zip"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="${SCRIPT_DIR}/tools"
JADX_DIR="${TOOLS_DIR}/jadx"
ZIP_PATH="${TOOLS_DIR}/jadx-${VERSION}.zip"

echo "Setting up jadx v${VERSION}..."
mkdir -p "${TOOLS_DIR}"

if [ ! -f "${JADX_DIR}/bin/jadx" ]; then
    echo "Downloading jadx-${VERSION}.zip from ${ZIP_URL}..."
    curl -L -o "${ZIP_PATH}" "${ZIP_URL}"
    
    echo "Extracting to ${JADX_DIR}..."
    rm -rf "${JADX_DIR}"
    mkdir -p "${JADX_DIR}"
    unzip -q "${ZIP_PATH}" -d "${JADX_DIR}"
    rm -f "${ZIP_PATH}"
    
    chmod +x "${JADX_DIR}/bin/jadx"
    echo "jadx extraction complete!"
else
    echo "jadx is already installed in ${JADX_DIR}"
fi

chmod +x "${JADX_DIR}/bin/jadx"
echo "Verifying jadx installation:"
"${JADX_DIR}/bin/jadx" -v
