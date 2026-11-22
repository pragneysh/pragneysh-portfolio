# ==============================================================================
# PowerShell Wrapper for Portfolio Deployment Automation
# ==============================================================================
param (
    [Parameter(Position=0, Mandatory=$false)]
    [string]$Command = "help",
    [Parameter(Position=1, Mandatory=$false, ValueFromRemainingArguments=$true)]
    [string[]]$ExtraArgs
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$gitBash = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path $gitBash) {
    $cmdLine = "./deploy.sh $Command"
    if ($ExtraArgs) {
        $cmdLine += " " + ($ExtraArgs -join " ")
    }
    & $gitBash -c $cmdLine
} else {
    Write-Error "Git Bash not found at $gitBash. Please execute deploy.sh directly."
}
