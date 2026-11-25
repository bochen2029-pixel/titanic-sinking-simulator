# U2's sea proof, driven end to end (docs/runbooks/U2_unreal_on_the_rtx_machine.md says when and where).
#   pwsh -NoProfile -File tools\unreal\u2.ps1 <verb> [-Out <dir>] [-Project <dir>] [-Engine <UE root>] [-Blender <exe>] [-Water 0|1]
#     inputs   the export, the recorded night, the Blender GLB, the expectations (node and Blender; no GPU)
#     setup    a content-only Unreal project for the proof (Python, editor scripting and Water on; Android File Server off)
#     proof    Unreal's Python commandlet runs tools/unreal/u2_sea.py (-nullrhi: no GPU), under the Unreal laptop lock
#     check    node tools/u2_expect.js --check: every step within 0.1 m
#     all      the four in order
#   This machine's own folders are not in the repository: each default is an environment variable, else a key in
#   tools\local_paths.json (untracked): -Out TITANIC_U2_OUT or "u2Out"; -Project TITANIC_U2_PROJECT or "u2Project";
#   -Engine UE_ROOT, else where the Epic Launcher puts it, else "ueRoot"; the Unreal lock TITANIC_UE_LOCK or "ueLock".
# Unreal runs from a shell WITHOUT the harness's sandbox (it hangs at "Waiting for ZenServer to be ready" in one: the plan,
# section 9.5), one Unreal process at a time, and never during a gate on the same machine.
param(
  [Parameter(Mandatory = $true, Position = 0)][ValidateSet('inputs', 'setup', 'proof', 'check', 'all')][string]$Verb,
  [string]$Out = '',
  [string]$Project = '',
  # Unreal 5.8: UE_ROOT, else where the Epic Launcher puts it, else "ueRoot" in tools\local_paths.json (below)
  [string]$Engine = $(if ($env:UE_ROOT) { $env:UE_ROOT } elseif (Test-Path 'C:\Program Files\Epic Games\UE_5.8') { 'C:\Program Files\Epic Games\UE_5.8' } else { '' }),
  [string]$Blender = $(if ($env:BLENDER) { $env:BLENDER } else { 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' }),
  [ValidateSet('0', '1')][string]$Water = '1'
)
$ErrorActionPreference = 'Stop'
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
# this machine's own folders: the parameter, else an environment variable, else tools\local_paths.json (untracked)
$LocalPaths = $null; $LocalFile = Join-Path $PSScriptRoot '..\local_paths.json'
if (Test-Path $LocalFile) { $LocalPaths = Get-Content -Raw $LocalFile | ConvertFrom-Json }
function Resolve-Default([string]$given, [string]$envName, [string]$key, [string]$what) {
  if ($given) { return $given }
  $v = [Environment]::GetEnvironmentVariable($envName); if ($v) { return $v }
  if ($LocalPaths -and $LocalPaths.$key) { return [string]$LocalPaths.$key }
  throw ('no ' + $what + ': give it, or set ' + $envName + ', or put "' + $key + '" in tools\local_paths.json')
}
$Out = Resolve-Default $Out 'TITANIC_U2_OUT' 'u2Out' 'output folder (-Out)'
if ($Verb -in 'setup', 'proof', 'all') { $Project = Resolve-Default $Project 'TITANIC_U2_PROJECT' 'u2Project' 'Unreal project folder (-Project)' }
if ($Verb -in 'proof', 'all') {
  $Engine = Resolve-Default $Engine 'UE_ROOT' 'ueRoot' 'Unreal 5.8 root (-Engine)'
  $Lock = Resolve-Default '' 'TITANIC_UE_LOCK' 'ueLock' 'Unreal laptop lock file'
}
function Say([string]$s) { Write-Host ('[u2] ' + $s) }
function Need([string]$path, [string]$what) { if (-not (Test-Path $path)) { throw "$what not found: $path" } }

function Invoke-Inputs {
  New-Item -ItemType Directory -Force $Out | Out-Null
  $env:TITANIC_OUT = $Out
  try {
    Push-Location $Repo
    node tools/export_ship.js 2>&1 | ForEach-Object { "$_" }; if ($LASTEXITCODE) { throw 'export_ship failed' }
    node tools/record_night.js 2>&1 | ForEach-Object { "$_" }; if ($LASTEXITCODE) { throw 'record_night failed' }
  } finally { Pop-Location; Remove-Item Env:TITANIC_OUT -ErrorAction SilentlyContinue }
  if (Test-Path $Blender) {
    & $Blender -b --factory-startup --python-exit-code 1 --python (Join-Path $Repo 'tools\blender\build_ship.py') -- --ship (Join-Path $Out 'titanic_ship.json') --out $Out 2>&1 | Select-String 'GEN_OK|Error|Traceback' | ForEach-Object { "$_" }
    if ($LASTEXITCODE) { throw 'Blender build failed' }
  } elseif (Test-Path (Join-Path $Out 'titanic_ship.glb')) {
    Say "no Blender here: using the GLB already in $Out (copied from the laptop)"
  } else { throw "no Blender at $Blender and no titanic_ship.glb in ${Out}: copy the laptop's -Out folder here, then run this again" }
  Push-Location $Repo
  try { node tools/u2_expect.js --night (Join-Path $Out 'titanic_night_1912.json') --out (Join-Path $Out 'u2_expected.json') 2>&1 | ForEach-Object { "$_" }; if ($LASTEXITCODE) { throw 'u2_expect failed' } } finally { Pop-Location }
  Say "inputs ready in $Out"
}

function Invoke-Setup {
  $root = Split-Path $Project -Parent
  New-Item -ItemType Directory -Force (Join-Path $Project 'Content') | Out-Null
  $name = Split-Path $Project -Leaf
  $uproject = Join-Path $Project ($name + '.uproject')
  $doc = [ordered]@{
    FileVersion = 3; EngineAssociation = '5.8'; Category = ''; Description = "U2's sea proof for the Titanic Sinking Simulator (tools/unreal/u2.ps1 setup)"
    Plugins = @(
      [ordered]@{ Name = 'PythonScriptPlugin'; Enabled = $true },
      [ordered]@{ Name = 'EditorScriptingUtilities'; Enabled = $true },
      [ordered]@{ Name = 'Water'; Enabled = $true },
      [ordered]@{ Name = 'AndroidFileServer'; Enabled = $false })
  }
  ($doc | ConvertTo-Json -Depth 5) | Set-Content -Path $uproject -Encoding utf8
  $gi = Join-Path $root '.gitignore'
  if (-not (Test-Path $gi)) { "Binaries/`nIntermediate/`nSaved/`nDerivedDataCache/`n*.sln`n.vs/`n" | Set-Content -Path $gi -Encoding utf8 -NoNewline }
  if (-not (Test-Path (Join-Path $root '.git'))) { git -C $root init -q -b main; Say "git init $root (local, no remote)" }
  Say "project ready: $uproject"
}

function Invoke-Proof {
  $exe = Join-Path $Engine 'Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
  Need $exe 'UnrealEditor-Cmd.exe'
  $uproject = Get-ChildItem -Path $Project -Filter *.uproject | Select-Object -First 1
  if (-not $uproject) { throw "no .uproject in $Project (run setup)" }
  foreach ($f in 'titanic_ship.glb', 'u2_expected.json') { Need (Join-Path $Out $f) $f }
  if (Get-Process -Name 'UnrealEditor*' -ErrorAction SilentlyContinue) { throw 'an Unreal process is running: one at a time (never stop one you did not start)' }
  if (Test-Path $Lock) { $held = (Get-Content $Lock -Raw).Trim(); if ($held) { throw "the Unreal lock is held: $held" } }
  New-Item -ItemType Directory -Force (Split-Path $Lock -Parent) | Out-Null       # a machine without the lock's folder yet
  ('u2-sea-proof U2 sea proof {0} 20' -f (Get-Date -Format 'HH:mm')) | Set-Content -Path $Lock -Encoding utf8
  try {
    $env:U2_GLB = Join-Path $Out 'titanic_ship.glb'
    $env:U2_EXPECTED = Join-Path $Out 'u2_expected.json'
    $env:U2_RESULT = Join-Path $Out 'u2_result.json'
    $env:U2_WATER = $Water
    $script = Join-Path $Repo 'tools\unreal\u2_sea.py'
    $log = Join-Path $Out 'u2_unreal.log'
    $argLine = '"{0}" -run=pythonscript -script="{1}" -unattended -nosplash -nullrhi -nop4 -stdout -FullStdOutLogOutput' -f $uproject.FullName, $script
    $t0 = Get-Date
    $p = Start-Process -FilePath $exe -ArgumentList $argLine -NoNewWindow -Wait -PassThru -RedirectStandardOutput $log
    Say ("Unreal exited {0} after {1:n0} s; log {2}" -f $p.ExitCode, ((Get-Date) - $t0).TotalSeconds, $log)
    Select-String -Path $log -Pattern 'U2_OK|U2_FAIL' | ForEach-Object { Say $_.Line }
  } finally {
    Remove-Item $Lock -ErrorAction SilentlyContinue
    foreach ($v in 'U2_GLB', 'U2_EXPECTED', 'U2_RESULT', 'U2_WATER') { Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
  }
  Need (Join-Path $Out 'u2_result.json') 'u2_result.json (see the log)'
}

function Invoke-Check {
  Push-Location $Repo
  try { node tools/u2_expect.js --check (Join-Path $Out 'u2_result.json') --expected (Join-Path $Out 'u2_expected.json') 2>&1 | ForEach-Object { "$_" }; $code = $LASTEXITCODE } finally { Pop-Location }
  if ($code) { throw 'the sea proof failed its check' }
}

# each step keeps its own record of what it printed, u2_<step>.txt in -Out: the one file to send back if it fails
New-Item -ItemType Directory -Force $Out | Out-Null
Start-Transcript -Path (Join-Path $Out ("u2_{0}.txt" -f $Verb)) -Force | Out-Null
try {
  switch ($Verb) {
    'inputs' { Invoke-Inputs }
    'setup' { Invoke-Setup }
    'proof' { Invoke-Proof }
    'check' { Invoke-Check }
    'all' { Invoke-Inputs; Invoke-Setup; Invoke-Proof; Invoke-Check }
  }
  Say "${Verb}: done"
} catch {
  Say ("$Verb FAILED: " + $_.Exception.Message)
  Say ("send back: " + (Join-Path $Out ("u2_{0}.txt" -f $Verb)) + $(if ($Verb -eq 'proof' -or $Verb -eq 'all') { ' and ' + (Join-Path $Out 'u2_unreal.log') } else { '' }))
  $failed = $true
} finally { Stop-Transcript | Out-Null }
if ($failed) { exit 1 }
