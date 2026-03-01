# Cloudflare Worker デプロイ用（uv が PATH にない場合でも実行可能）
$uvPath = "C:\Users\jemin\AppData\Local\Python\pythoncore-3.14-64\Scripts\uv.exe"
if (-not (Test-Path $uvPath)) {
    $uvPath = "$env:LOCALAPPDATA\Programs\Python\Python314\Scripts\uv.exe"
}
if (-not (Test-Path $uvPath)) {
    Write-Host "uv が見つかりません。先に pip install uv または https://docs.astral.sh/uv/ でインストールしてください。"
    exit 1
}
Set-Location $PSScriptRoot
& $uvPath run pywrangler deploy
exit $LASTEXITCODE
