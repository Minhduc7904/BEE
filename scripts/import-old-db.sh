#!/bin/bash
# Script import file backup.sql vào old_db (Linux/Mac)

echo "╔═══════════════════════════════════════════╗"
echo "║   📥 IMPORT BACKUP.SQL TO OLD_DB         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Đọc cấu hình từ .env
if [ -f .env ]; then
    source <(grep OLD_DATABASE_URL .env | sed 's/^/export /')
    
    # Parse MySQL connection string
    # mysql://user:password@host:port/database
    if [[ $OLD_DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        echo "📊 Database Info:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
        echo ""
        
        # Kiểm tra file backup
        BACKUP_FILE="backup/backup.sql"
        if [ ! -f "$BACKUP_FILE" ]; then
            echo "❌ File backup.sql not found at: $BACKUP_FILE"
            exit 1
        fi
        
        echo "✅ Found backup file: $BACKUP_FILE"
        
        # Tạo database nếu chưa tồn tại
        echo "🔨 Creating database if not exists..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        
        if [ $? -ne 0 ]; then
            echo "❌ Failed to create database"
            exit 1
        fi
        
        echo "✅ Database ready"
        
        # Import SQL file
        echo "📥 Importing backup.sql..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✨ Import completed successfully!"
            echo ""
            
            # Hiển thị thông tin tables
            echo "📊 Tables in database:"
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"
        else
            echo ""
            echo "❌ Import failed!"
            exit 1
        fi
    else
        echo "❌ Cannot parse OLD_DATABASE_URL"
        echo "Expected format: mysql://user:password@host:port/database"
        exit 1
    fi
else
    echo "❌ .env file not found"
    echo "Please create .env file with OLD_DATABASE_URL"
    exit 1
fi
