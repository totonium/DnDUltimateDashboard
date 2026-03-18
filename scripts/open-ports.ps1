$ErrorActionPreference = "Stop"

$rules = @(
    @{Name="DnD Dashboard Frontend";Port=3000},
    @{Name="DnD Dashboard Backend";Port=8080}
)

foreach ($rule in $rules) {
    $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "Rule already exists: $($rule.Name)"
    } else {
        New-NetFirewallRule -DisplayName $rule.Name `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $rule.Port `
            -Action Allow `
            -Profile Private `
            -Description "Allows access to DnD Dashboard $($rule.Name) from local network"
        Write-Host "Created rule: $($rule.Name) (port $($rule.Port))"
    }
}

Write-Host "`nFirewall rules active. Ports $((($rules | ForEach-Object { $_.Port }) -join ', ')) are now open on Private networks."
