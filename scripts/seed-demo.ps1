$ErrorActionPreference = 'Stop'

if ($env:SEED_DEMO_USERS -ne 'true') {
    throw 'Set SEED_DEMO_USERS=true to opt in to demo users.'
}
if (-not $env:DEMO_PASSWORD) {
    throw 'Set DEMO_PASSWORD in the process environment; it is never written to the repository.'
}
if (-not $env:DB_NAME) {
    throw 'DB_NAME is required.'
}

$hash = (node scripts/hash-seed-passwords.js).Trim()
if ($hash -notmatch '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') {
    throw 'The generated password hash is not a bcrypt cost-12 hash.'
}

function Get-SqlBaseArguments {
    $serverName = if ($env:DB_SERVER) { $env:DB_SERVER } else { 'localhost' }
    if ($env:DB_USER -and $env:DB_PASSWORD) {
        return @('-S', $serverName, '-U', $env:DB_USER, '-P', $env:DB_PASSWORD, '-C')
    }
    return @('-S', $serverName, '-E')
}

$arguments = Get-SqlBaseArguments
& sqlcmd @arguments -f 65001 -b -v "DatabaseName=$env:DB_NAME" "DemoPasswordHash=$hash" -i database/seed/demo_users.sql
if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed with exit code $LASTEXITCODE" }
Write-Output 'Demo users seeded with the supplied password.'
