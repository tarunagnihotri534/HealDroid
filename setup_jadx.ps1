# setup_jadx.ps1
$ErrorActionPreference = "Stop"

$version = "1.5.6"
$zipUrl = "https://github.com/skylot/jadx/releases/download/v$version/jadx-$version.zip"
$toolsDir = Join-Path $PSScriptRoot "tools"
$jadxDir = Join-Path $toolsDir "jadx"
$zipPath = Join-Path $toolsDir "jadx-$version.zip"

Write-Host "Setting up jadx v$version..."

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir | Out-Null
}

if (-not (Test-Path (Join-Path $jadxDir "bin/jadx.bat"))) {
    Write-Host "Downloading jadx-$version.zip from $zipUrl..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
    
    Write-Host "Extracting to $jadxDir..."
    if (Test-Path $jadxDir) {
        Remove-Item -Recurse -Force $jadxDir
    }
    Expand-Archive -Path $zipPath -DestinationPath $jadxDir -Force
    Remove-Item -Force $zipPath
    Write-Host "jadx extraction complete!"
} else {
    Write-Host "jadx is already installed in $jadxDir"
}

# Verify
$jadxBin = Join-Path $jadxDir "bin/jadx.bat"
if (Test-Path $jadxBin) {
    Write-Host "Verifying jadx installation:"
    & $jadxBin -v
} else {
    Write-Error "Failed to locate $jadxBin after setup."
}
