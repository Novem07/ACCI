$ErrorActionPreference = 'Stop'
$smokeDbName = 'ACCI_CI_SMOKE'

function Invoke-SqlCommand {
    param([string[]]$Arguments)
    & sqlcmd @Arguments
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed with exit code $LASTEXITCODE" }
}

function Get-SqlBaseArguments {
    $serverName = if ($env:DB_SERVER) { $env:DB_SERVER } else { 'localhost' }
    if ($env:DB_USER -and $env:DB_PASSWORD) {
        return @('-S', $serverName, '-U', $env:DB_USER, '-P', $env:DB_PASSWORD, '-C')
    }
    return @('-S', $serverName, '-E')
}

$baseArguments = Get-SqlBaseArguments
$existing = & sqlcmd @baseArguments -h -1 -W -Q "SET NOCOUNT ON; SELECT DB_ID(N'$smokeDbName')"
if (($existing | Out-String).Trim() -notin @('', 'NULL', '0')) {
    throw "$smokeDbName already exists; refusing to use an unknown database."
}

try {
    Invoke-SqlCommand ($baseArguments + @('-b', '-v', "DatabaseName=$smokeDbName", '-i', 'database/migrations/001_baseline.sql'))
    Invoke-SqlCommand ($baseArguments + @('-b', '-v', "DatabaseName=$smokeDbName", '-i', 'database/migrations/002_auth_and_workflow_integrity.sql'))
    Invoke-SqlCommand ($baseArguments + @('-b', '-v', "DatabaseName=$smokeDbName", '-i', 'Trigger.sql'))
    Invoke-SqlCommand ($baseArguments + @('-b', '-Q', "USE [$smokeDbName]; IF OBJECT_ID(N'dbo.ChiTietPhieuDangKy') IS NULL THROW 51000, 'missing registration detail table', 1; IF OBJECT_ID(N'dbo.trg_check_role_tiepnhan_dk', N'TR') IS NULL THROW 51001, 'missing trigger', 1;"))
    Write-Output 'Database smoke test passed.'
}
finally {
    & sqlcmd @baseArguments -b -Q "IF DB_ID(N'$smokeDbName') IS NOT NULL BEGIN ALTER DATABASE [$smokeDbName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$smokeDbName]; END"
}
