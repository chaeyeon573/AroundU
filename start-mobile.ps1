# 폰에서 AroundU 열기 — 모바일 전용 클론 폴더(AroundU-mobile)를 써서 다른 세션의 브랜치 전환에 영향받지 않는다.
# PowerShell:  .\start-mobile.ps1
$Branch = 'claude/brave-galileo-23tdq1'
$Dir = Join-Path $HOME 'AroundU-mobile'
if (-not (Test-Path (Join-Path $Dir '.git'))) {
  git clone -b $Branch https://github.com/chaeyeon573/AroundU.git $Dir
}
Set-Location $Dir
git checkout -- . 2>$null
git checkout $Branch
git pull origin $Branch
npm install --no-audit --no-fund
Set-Location (Join-Path $Dir 'apps\mobile')
npx expo start --tunnel --clear
