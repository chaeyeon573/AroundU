# 폰에서 AroundU 열기: PowerShell에서  .\start-mobile.ps1
Set-Location $PSScriptRoot
git fetch origin claude/brave-galileo-23tdq1
git checkout -- package-lock.json 2>$null
git checkout claude/brave-galileo-23tdq1
git pull origin claude/brave-galileo-23tdq1
npm install --no-audit --no-fund
Set-Location apps\mobile
npx expo start --tunnel --clear
