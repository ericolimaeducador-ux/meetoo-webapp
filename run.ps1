$ErrorActionPreference = "Stop"

$pythonPath = Join-Path $env:LOCALAPPDATA "Programs\Python\Python310\python.exe"

if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3.10 app.py
    exit $LASTEXITCODE
}

if (Test-Path $pythonPath) {
    & $pythonPath app.py
    exit $LASTEXITCODE
}

Write-Error "Python 3.10 nao foi encontrado. Instale com: winget install --id Python.Python.3.10 --exact"
