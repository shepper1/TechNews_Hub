Write-Host "=== TechNews Hub ===" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    npm install
}

if (Test-Path ".cache\articles.json") {
    Write-Host "Suppression du cache..." -ForegroundColor Yellow
    Remove-Item ".cache\articles.json"
}

Write-Host "Demarrage du serveur..." -ForegroundColor Green
npm run dev
