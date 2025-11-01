Param(
  [string]$Base = "http://localhost:3013"
)

$ErrorActionPreference = "Stop"

function Register-PendingVendor {
  param([string]$Email)
  $body = @{ nome = 'Teste'; sobrenome = 'Pendente'; email = $Email; senha = 'SenhaF0rte!123'; nomeLoja = 'Loja ' + $Email; documento = '12345678900' } | ConvertTo-Json -Depth 6
  return Invoke-RestMethod -Uri ($Base + '/api/vendors/register') -Method Post -ContentType 'application/json' -Body $body
}

function Login-Admin {
  $sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $body = @{ email = 'admin@local'; senha = 'admin' } | ConvertTo-Json -Depth 4
  $login = Invoke-RestMethod -Uri ($Base + '/api/auth/login') -Method Post -ContentType 'application/json' -Body $body -WebSession $sess
  return $sess
}

function Get-PendingRaw {
  param([Microsoft.PowerShell.Commands.WebRequestSession]$Session)
  return Invoke-RestMethod -Uri ($Base + '/api/vendors/pending/raw') -Method Get -WebSession $Session
}

function Update-VendorStatus {
  param([Microsoft.PowerShell.Commands.WebRequestSession]$Session, [int]$VendorId, [string]$Status)
  $body = @{ status = $Status } | ConvertTo-Json -Depth 3
  return Invoke-RestMethod -Uri ($Base + '/api/vendors/' + $VendorId) -Method Put -ContentType 'application/json' -Body $body -WebSession $Session
}

try {
  $uniq1 = (Get-Random -Maximum 99999999)
  $email1 = "pendente.$uniq1@local.test"
  $reg1 = Register-PendingVendor -Email $email1
  $vid1 = [int]$reg1.vendor.id
  Write-Host ("Criado pendente (aprovar): id=" + $vid1 + " email=" + $email1)

  $adminSess = Login-Admin
  Write-Host "Admin autenticado"

  $pend1 = Get-PendingRaw -Session $adminSess
  $has1 = ($pend1.data | Where-Object { $_.vendedorId -eq $vid1 })
  Write-Host ("Antes de aprovar, pendências contém vendedor? " + ([bool]$has1))

  [void](Update-VendorStatus -Session $adminSess -VendorId $vid1 -Status 'ativo')
  Write-Host "Aprovado"

  $pend1b = Get-PendingRaw -Session $adminSess
  $has1b = ($pend1b.data | Where-Object { $_.vendedorId -eq $vid1 })
  Write-Host ("Após aprovar, pendências contém vendedor? " + ([bool]$has1b))

  $uniq2 = (Get-Random -Maximum 99999999)
  $email2 = "pendente.$uniq2@local.test"
  $reg2 = Register-PendingVendor -Email $email2
  $vid2 = [int]$reg2.vendor.id
  Write-Host ("Criado pendente (rejeitar): id=" + $vid2 + " email=" + $email2)

  $pend2 = Get-PendingRaw -Session $adminSess
  $has2 = ($pend2.data | Where-Object { $_.vendedorId -eq $vid2 })
  Write-Host ("Antes de rejeitar, pendências contém vendedor? " + ([bool]$has2))

  [void](Update-VendorStatus -Session $adminSess -VendorId $vid2 -Status 'inativo')
  Write-Host "Rejeitado"

  $pend2b = Get-PendingRaw -Session $adminSess
  $has2b = ($pend2b.data | Where-Object { $_.vendedorId -eq $vid2 })
  Write-Host ("Após rejeitar, pendências contém vendedor? " + ([bool]$has2b))

} catch {
  Write-Error $_
  exit 1
}
