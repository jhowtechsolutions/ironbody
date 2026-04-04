# Primeiro envio do IronBody para GitHub.
# Remoto: https://github.com/jhowtechsolutions/ironbody
#
# Uso (PowerShell, na raiz do projeto):
#   cd d:\PersonalProjects\IronBody\IronBody
#   .\scripts\git-first-push.ps1
#   .\scripts\git-first-push.ps1 -Message "feat: initial import"
#
# Autenticacao: GitHub CLI (gh auth login) ou token quando o git pedir senha no HTTPS.

param(
    [string] $Message = "Initial commit: IronBody monorepo"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git nao encontrado no PATH. Instale: https://git-scm.com/download/win"
}

if (-not (Test-Path ".git")) {
    git init
}

git branch -M main 2>$null

$null = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin "https://github.com/jhowtechsolutions/ironbody.git"
} else {
    Write-Host "Remote origin ja configurado."
}

git add -A
git status
git commit -m $Message
git push -u origin main

Write-Host "Feito: https://github.com/jhowtechsolutions/ironbody"
