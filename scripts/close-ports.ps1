$ErrorActionPreference = "Stop"

$rules = @(
    @{Name="DnD Dashboard Frontend";Port=3000},
    @{Name="DnD Dashboard Backend";Port=8080}
)

foreach ($rule in $rules) {
    $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existingRule) {
        Remove-NetFirewallRule -DisplayName $rule.Name
        Write-Host "Removed rule: $($rule.Name) (port $($rule.Port))"
    } else {
        Write-Host "Rule not found: $($rule.Name)"
    }
}

Write-Host "`nAll firewall rules removed. Ports $((($rules | ForEach-Object { $_.Port }) -join ', ')) are now closed."
