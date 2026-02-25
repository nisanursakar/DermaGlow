# Android Studio kilit sorununu gidermek icin calistirin
# Sag tikla -> "PowerShell ile Calistir" veya PowerShell'de: .\fix-android-studio-lock.ps1

Write-Host "Android Studio kilit temizleniyor..." -ForegroundColor Cyan

# 1. Process'leri kapat (varsa)
taskkill /F /IM studio64.exe 2>$null
taskkill /F /IM "Android Studio.exe" 2>$null
Start-Sleep -Seconds 2

# 2. JetBrains lock dosyalarini sil
$jetbrainsPath = "$env:LOCALAPPDATA\JetBrains"
if (Test-Path $jetbrainsPath) {
    Get-ChildItem -Path $jetbrainsPath -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $jetbrainsPath -Directory -Filter "*lock*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "JetBrains kilit dosyalari temizlendi." -ForegroundColor Green
}

# 3. Proje .idea lock
$ideaLock = "$PSScriptRoot\.idea\*.lock"
if (Test-Path "$PSScriptRoot\.idea") {
    Remove-Item -Path $ideaLock -Force -ErrorAction SilentlyContinue
    Write-Host "Proje .idea kilidi temizlendi." -ForegroundColor Green
}

Write-Host ""
Write-Host "Tamamlandi. Simdi Android Studio'yu tekrar acmayi deneyin." -ForegroundColor Yellow
Write-Host "Hala acilmazsa bilgisayari yeniden baslatin." -ForegroundColor Yellow
