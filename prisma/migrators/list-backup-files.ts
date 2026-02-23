import * as fs from 'fs';
import * as path from 'path';

/**
 * Script để list tất cả files trong backup minio
 */
function listMinioBackupFiles() {
    const backupPath = path.join(__dirname, '../../backup/minio-backup');
    
    console.log('📂 MinIO Backup Structure:\n');
    console.log(`Base Path: ${backupPath}\n`);

    if (!fs.existsSync(backupPath)) {
        console.error('❌ Backup folder not found!');
        return;
    }

    // List folders
    const folders = fs.readdirSync(backupPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found ${folders.length} folders:\n`);

    folders.forEach(folder => {
        const folderPath = path.join(backupPath, folder);
        const files = fs.readdirSync(folderPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);

        console.log(`📁 ${folder}/ (${files.length} files)`);
        
        // Show first 5 files as examples
        const exampleFiles = files.slice(0, 5);
        exampleFiles.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            const sizeInKB = (stats.size / 1024).toFixed(2);
            console.log(`   - ${file} (${sizeInKB} KB)`);
        });

        if (files.length > 5) {
            console.log(`   ... and ${files.length - 5} more files`);
        }
        console.log('');
    });

    // Total stats
    let totalFiles = 0;
    let totalSize = 0;

    folders.forEach(folder => {
        const folderPath = path.join(backupPath, folder);
        const files = fs.readdirSync(folderPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile());

        totalFiles += files.length;

        files.forEach(file => {
            const filePath = path.join(folderPath, file.name);
            totalSize += fs.statSync(filePath).size;
        });
    });

    console.log('📊 Total Statistics:');
    console.log(`   Folders: ${folders.length}`);
    console.log(`   Files: ${totalFiles}`);
    console.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

// Run
listMinioBackupFiles();
