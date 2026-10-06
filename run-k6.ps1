param(
  [string]$TestFile = "tests/performance/coverage-items-load-test.js",
  [string]$BaseUrl = "http://localhost:3000"
)

$k6Path = "C:\file\gadget\tools\k6\k6.exe"

if (-not (Test-Path $k6Path)) {
  Write-Error "k6 binary tidak ditemukan di $k6Path"
  exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Menjalankan Grafana k6 - Coverage Items for Performance" -ForegroundColor Cyan
Write-Host " Target URL : $BaseUrl" -ForegroundColor Yellow
Write-Host " Script     : $TestFile" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

& $k6Path run -e BASE_URL=$BaseUrl $TestFile
