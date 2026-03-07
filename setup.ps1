# AI Math Tutor - 一键配置与启动脚本 (Windows)

$host.UI.RawUI.WindowTitle = "AI Math Tutor Setup"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   AI Math Tutor - 团队一键部署工具 v1.0" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. 检查 Node.js
Write-Host "`n[1/4] 正在检查环境..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未检测到 Node.js，请先安装: https://nodejs.org/" -ForegroundColor Red
    exit
}
Write-Host "✓ Node.js 已就绪" -ForegroundColor Green

# 2. 安装依赖
Write-Host "`n[2/4] 正在安装项目依赖 (可能需要 1-2 分钟)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 依赖安装失败，请检查网络。" -ForegroundColor Red
    exit
}
Write-Host "✓ 依赖安装成功" -ForegroundColor Green

# 3. 配置 API Key
Write-Host "`n[3/4] 配置 Gemini API Key..." -ForegroundColor Yellow
if (!(Test-Path .env.local)) {
    $apiKey = Read-Host "请输入您的 Google Gemini API Key"
    if ($apiKey -ne "") {
        "GEMINI_API_KEY=$apiKey" | Out-File -FilePath .env.local -Encoding utf8
        Write-Host "✓ .env.local 配置文件已生成" -ForegroundColor Green
    } else {
        Write-Host "警告: 未输入 Key，项目将无法正常调用 AI 功能。" -ForegroundColor Red
    }
} else {
    Write-Host "✓ 检测到已存在 .env.local 配置文件" -ForegroundColor Green
}

# 4. 获取局域网 IP
Write-Host "`n[4/4] 准备就绪！" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|Virtual' } | Select-Object -First 1).IPAddress

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "  🎉 配置完成！启动开发服务器中..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "电脑访问: http://localhost:3000" -ForegroundColor White
Write-Host "iPad 访问: http://$($ip):3000" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host "===============================================" -ForegroundColor Green
Write-Host "(小贴士: 在 iPad Safari 中将页面 '添加到主屏幕' 体验最佳)" -ForegroundColor Gray

npm run dev
