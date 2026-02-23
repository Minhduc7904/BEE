# Script import file backup.sql vao old_db
# Encoding: UTF-8

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   IMPORT BACKUP.SQL TO OLD_DB" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Doc cau hinh tu .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with OLD_DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Parse OLD_DATABASE_URL from .env
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

# Parse MySQL connection string: mysql://user:password@host:port/database
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
    
    # Kiem tra file backup
    $backupFile = "backup\backup.sql"
    if (-not (Test-Path $backupFile)) {
        Write-Host "ERROR: File backup.sql not found at: $backupFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Found backup file: $backupFile" -ForegroundColor Green
    Write-Host ""
    
    # Tao database neu chua ton tai
    Write-Host "Creating database if not exists..." -ForegroundColor Yellow
    $createDbCommand = "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    $env:MYSQL_PWD = $dbPassword
    mysql -h $dbHost -P $dbPort -u $dbUser -e $createDbCommand 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create database" -ForegroundColor Red
        $env:MYSQL_PWD = $null
        exit 1
    }
    
    Write-Host "Database ready" -ForegroundColor Green
    Write-Host ""
    
    # Import SQL file using Get-Content and pipe
    Write-Host "Importing backup.sql..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    Get-Content $backupFile -Raw | mysql -h $dbHost -P $dbPort -u $dbUser $dbName 2>&1 | Out-Null
    
    $env:MYSQL_PWD = $null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Import completed successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Hien thi thong tin tables
        Write-Host "Tables in database:" -ForegroundColor Yellow
        $env:MYSQL_PWD = $dbPassword
        mysql -h $dbHost -P $dbPort -u $dbUser $dbName -e "SHOW TABLES;"
        $env:MYSQL_PWD = $null
    } else {
        Write-Host ""
        Write-Host "ERROR: Import failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Cannot parse OLD_DATABASE_URL" -ForegroundColor Red
    Write-Host "Expected format: mysql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}
