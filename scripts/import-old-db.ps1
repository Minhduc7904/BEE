# =============================================
# IMPORT backup.sql INTO OLD_DB (UTF8 SAFE)
# =============================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   IMPORT BACKUP.SQL TO OLD_DB (UTF8 SAFE)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ---------- Load .env ----------
$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}

$dbUrl = ""

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*OLD_DATABASE_URL\s*=\s*"?(.+?)"?\s*$') {
        $dbUrl = $matches[1]
    }
}

if ([string]::IsNullOrEmpty($dbUrl)) {
    Write-Host "ERROR: OLD_DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

# ---------- Parse connection string ----------
if ($dbUrl -match 'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {

    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]

    Write-Host "Database Info:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost"
    Write-Host "  Port: $dbPort"
    Write-Host "  Database: $dbName"
    Write-Host "  User: $dbUser"
    Write-Host ""

    # ---------- Check backup file ----------
    $backupFile = "backup\backup.sql"

    if (-not (Test-Path $backupFile)) {
        Write-Host "ERROR: backup.sql not found at $backupFile" -ForegroundColor Red
        exit 1
    }

    Write-Host "Found backup file: $backupFile" -ForegroundColor Green
    Write-Host ""

    # ---------- Create DB with utf8mb4 ----------
    Write-Host "Dropping existing database (if any)..." -ForegroundColor Yellow
    
    $env:MYSQL_PWD = $dbPassword
    
    $dropDbSql = "DROP DATABASE IF EXISTS ``$dbName``;"
    mysql -h $dbHost -P $dbPort -u $dbUser -e $dropDbSql
    
    Write-Host "Creating fresh database..." -ForegroundColor Yellow

    $createDbSql = "CREATE DATABASE ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    mysql -h $dbHost -P $dbPort -u $dbUser --default-character-set=utf8mb4 -e $createDbSql

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create database" -ForegroundColor Red
        $env:MYSQL_PWD = $null
        exit 1
    }

    Write-Host "Database ready (utf8mb4)" -ForegroundColor Green
    Write-Host ""

    # ---------- Import SQL directly (NO PIPE) ----------
    Write-Host "Importing backup.sql..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray

    # Prepend foreign key checks disable to SQL content
    $sqlContent = "SET FOREIGN_KEY_CHECKS=0;`nSET NAMES utf8mb4;`n" + (Get-Content $backupFile -Encoding UTF8 -Raw) + "`nSET FOREIGN_KEY_CHECKS=1;"

    $sqlContent | mysql -h $dbHost -P $dbPort -u $dbUser --default-character-set=utf8mb4 --database=$dbName

    $exitCode = $LASTEXITCODE
    $env:MYSQL_PWD = $null

    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "IMPORT SUCCESS (UTF8 SAFE)" -ForegroundColor Green
        Write-Host ""

        Write-Host "Verifying charset..." -ForegroundColor Yellow
        $env:MYSQL_PWD = $dbPassword
        mysql -h $dbHost -P $dbPort -u $dbUser -e "SHOW CREATE DATABASE \`$dbName\`;"
        $env:MYSQL_PWD = $null
    }
    else {
        Write-Host ""
        Write-Host "ERROR: Import failed!" -ForegroundColor Red
        exit 1
    }

}
else {
    Write-Host "ERROR: Cannot parse OLD_DATABASE_URL" -ForegroundColor Red
    exit 1
}