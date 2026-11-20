param([switch]$PrepareOnly)

$ErrorActionPreference = 'Stop'

# VS Code tasks started with -NoProfile may not define HOME. ADB then tries to
# create its configuration directory at `\.android`, which fails on Windows
# and prevents the USB reverse-port mapping from being installed.
if ([string]::IsNullOrWhiteSpace($env:ANDROID_USER_HOME)) {
    if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
        throw 'USERPROFILE is not set, so ADB cannot locate its configuration directory.'
    }
    $env:ANDROID_USER_HOME = Join-Path $env:USERPROFILE '.android'
}
if (-not (Test-Path -LiteralPath $env:ANDROID_USER_HOME)) {
    New-Item -ItemType Directory -Path $env:ANDROID_USER_HOME -Force | Out-Null
}

$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
if (-not (Test-Path -LiteralPath $adb)) {
    throw "ADB was not found at $adb. Install Android platform-tools or update this script path."
}

$deviceLines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '^\S+\s+device$' }
$deviceIds = @($deviceLines | ForEach-Object { ($_ -split '\s+')[0] })
if ($deviceIds.Count -eq 0) {
    throw 'No authorized Android phone found. Connect the phone, enable USB debugging, and accept its authorization prompt.'
}
if ($deviceIds.Count -gt 1) {
    throw "More than one Android device is connected: $($deviceIds -join ', '). Disconnect the others and run this script again."
}
$deviceId = $deviceIds[0]

if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 5000 -InformationLevel Quiet)) {
    throw 'Backend is not reachable on this PC at port 5000. Start it in another terminal with: cd ..\backend; npm run dev'
}

& $adb -s $deviceId reverse tcp:5000 tcp:5000
if ($LASTEXITCODE -ne 0) {
    throw 'Could not create the phone-to-PC port mapping. Check the USB connection and USB debugging authorization.'
}

Write-Host "Phone $deviceId is mapped to the local backend on port 5000."
if ($PrepareOnly) {
    exit 0
}

Write-Host 'Starting Flutter...'
flutter run -d $deviceId --dart-define=API_BASE_URL=http://localhost:5000/api/v1
