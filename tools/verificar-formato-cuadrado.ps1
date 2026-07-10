$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
node tools/verificar-formato-cuadrado.mjs
if ($LASTEXITCODE -ne 0) {
  throw 'La verificación del formato cuadrado encontró errores.'
}
Write-Host 'Formato cuadrado conectado correctamente.' -ForegroundColor Green
