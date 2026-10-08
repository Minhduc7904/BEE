import { execFileSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Integration test chạy hai migration phá vỡ tương thích trên MySQL 8 thật với dữ liệu mẫu.
 *
 * Cần MIGRATION_IT_DATABASE_URL trỏ tới MySQL server với tài khoản có quyền tạo database, ví dụ:
 *   MIGRATION_IT_DATABASE_URL="mysql://root:pw@127.0.0.1:3306" npx jest migration.integration
 * (không cần tên database; test tự tạo và xóa một database riêng).
 *
 * Trong CI đặt REQUIRE_DB_INTEGRATION_TESTS=true: thiếu biến môi trường khi đó là lỗi, không được skip.
 */
const serverUrl = process.env.MIGRATION_IT_DATABASE_URL
const required = process.env.REQUIRE_DB_INTEGRATION_TESTS === 'true'

const MIGRATIONS_DIR = resolve(__dirname, '../../../prisma/migrations')
const SCHEMA_FILE = resolve(__dirname, '../../../prisma/schema.prisma')
const ATTENDANCE_MIGRATION = '20261004120000_split_attendance_type'
const GROUP_MIGRATION = '20261005090000_replace_course_class_makeup_options_with_groups'
const NEW_MIGRATIONS = [ATTENDANCE_MIGRATION, GROUP_MIGRATION]

if (!serverUrl && required) {
  it('MIGRATION_IT_DATABASE_URL phải được cấu hình khi REQUIRE_DB_INTEGRATION_TESTS=true', () => {
    throw new Error('MIGRATION_IT_DATABASE_URL is required in CI; the migration integration suite must not be skipped')
  })
}

const describeWithDatabase = serverUrl ? describe : describe.skip

function databaseUrl(base: string, database: string): string {
  const url = new URL(base)
  url.pathname = `/${database}`
  return url.toString()
}

describeWithDatabase('migration split attendance type + makeup groups (MySQL 8)', () => {
  jest.setTimeout(300000)

  const databaseName = `bee_migration_it_${Date.now()}`
  const workDir = mkdtempSync(join(tmpdir(), 'bee-migrations-'))
  let admin: PrismaClient
  let db: PrismaClient
  let targetUrl: string

  function migrateDeploy() {
    execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', join(workDir, 'schema.prisma')], {
      env: { ...process.env, DATABASE_URL: targetUrl },
      stdio: 'pipe',
      cwd: resolve(__dirname, '../../..'),
    })
  }

  const count = async (sql: string): Promise<number> => {
    const rows = await db.$queryRawUnsafe<Array<{ n: bigint | number }>>(sql)
    return Number(rows[0].n)
  }

  beforeAll(async () => {
    targetUrl = databaseUrl(serverUrl as string, databaseName)
    admin = new PrismaClient({ datasources: { db: { url: databaseUrl(serverUrl as string, 'mysql') } } })
    await admin.$executeRawUnsafe(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    db = new PrismaClient({ datasources: { db: { url: targetUrl } } })

    // Migration history without the two release migrations = the production state before this release.
    mkdirSync(join(workDir, 'migrations'))
    cpSync(SCHEMA_FILE, join(workDir, 'schema.prisma'))
    cpSync(join(MIGRATIONS_DIR, 'migration_lock.toml'), join(workDir, 'migrations', 'migration_lock.toml'))
    for (const name of readdirSync(MIGRATIONS_DIR)) {
      if (!NEW_MIGRATIONS.includes(name) && existsSync(join(MIGRATIONS_DIR, name, 'migration.sql'))) {
        cpSync(join(MIGRATIONS_DIR, name), join(workDir, 'migrations', name), { recursive: true })
      }
    }
    migrateDeploy()
  })

  afterAll(async () => {
    await db?.$disconnect()
    await admin?.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${databaseName}\``)
    await admin?.$disconnect()
    rmSync(workDir, { recursive: true, force: true })
  })

  it('narrowing the status enum while a MAKEUP row exists fails, so the data move must come first', async () => {
    const fixtureDb = `${databaseName}_order`
    await admin.$executeRawUnsafe(`CREATE DATABASE \`${fixtureDb}\``)
    try {
      const scratch = new PrismaClient({ datasources: { db: { url: databaseUrl(serverUrl as string, fixtureDb) } } })
      try {
        await scratch.$executeRawUnsafe("CREATE TABLE attendances (id INT PRIMARY KEY, status ENUM('PRESENT','ABSENT','LATE','MAKEUP') NOT NULL)")
        await scratch.$executeRawUnsafe("INSERT INTO attendances VALUES (1, 'MAKEUP')")
        await expect(
          scratch.$executeRawUnsafe("ALTER TABLE attendances MODIFY COLUMN status ENUM('PRESENT','ABSENT','LATE') NOT NULL"),
        ).rejects.toThrow()
      } finally {
        await scratch.$disconnect()
      }
    } finally {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${fixtureDb}\``)
    }
  })

  it('migrates attendance data without losing rows and removes the old options table', async () => {
    // The old schema is in place: legacy MAKEUP status is still valid and the options table exists.
    expect(
      await count(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendances' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE '%MAKEUP%'`,
      ),
    ).toBe(1)
    expect(await count(`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_class_makeup_options'`)).toBe(1)

    // Sample data (single connection with FK checks off: only the migrated columns matter here).
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
      await tx.$executeRawUnsafe(`
        INSERT INTO attendances (attendance_id, session_id, student_id, status, marked_at, updated_at) VALUES
          (1, 1, 1, 'PRESENT', NOW(), NOW()),
          (2, 1, 2, 'ABSENT',  NOW(), NOW()),
          (3, 1, 3, 'LATE',    NOW(), NOW()),
          (4, 1, 4, 'MAKEUP',  NOW(), NOW())`)
      await tx.$executeRawUnsafe(`
        INSERT INTO course_class_makeup_options (source_class_id, makeup_class_id) VALUES (10, 11), (10, 12), (11, 10)`)
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    })
    expect(await count('SELECT COUNT(*) AS n FROM attendances')).toBe(4)
    expect(await count('SELECT COUNT(*) AS n FROM course_class_makeup_options')).toBe(3)

    for (const name of NEW_MIGRATIONS) {
      cpSync(join(MIGRATIONS_DIR, name), join(workDir, 'migrations', name), { recursive: true })
    }
    migrateDeploy()

    // Attendance history is preserved and reclassified.
    expect(await count('SELECT COUNT(*) AS n FROM attendances')).toBe(4)
    const rows = await db.$queryRawUnsafe<Array<{ id: number; status: string; type: string }>>(
      'SELECT attendance_id AS id, status, attendance_type AS type FROM attendances ORDER BY attendance_id',
    )
    expect(rows.map((row) => [row.id, row.status, row.type])).toEqual([
      [1, 'PRESENT', 'REGULAR'],
      [2, 'ABSENT', 'REGULAR'],
      [3, 'LATE', 'REGULAR'],
      [4, 'PRESENT', 'MAKEUP'],
    ])
    expect(await count(`SELECT COUNT(*) AS n FROM attendances WHERE attendance_type = 'MAKEUP'`)).toBe(1)

    // The legacy status value is gone from the enum.
    const statusColumn = await db.$queryRawUnsafe<Array<{ type: string }>>(
      `SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendances' AND COLUMN_NAME = 'status'`,
    )
    expect(statusColumn[0].type).toBe("enum('PRESENT','ABSENT','LATE')")

    // Old options table replaced by the two group tables.
    expect(await count(`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_class_makeup_options'`)).toBe(0)
    expect(
      await count(
        `SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('course_class_makeup_groups', 'course_class_makeup_group_members')`,
      ),
    ).toBe(2)

    // class_id is the primary key of members (one class, one group) with cascading foreign keys.
    const primaryKey = await db.$queryRawUnsafe<Array<{ column: string }>>(
      `SELECT COLUMN_NAME AS \`column\` FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_class_makeup_group_members' AND CONSTRAINT_NAME = 'PRIMARY'`,
    )
    expect(primaryKey.map((row) => row.column)).toEqual(['class_id'])
    const cascades = await db.$queryRawUnsafe<Array<{ deleteRule: string }>>(
      `SELECT DELETE_RULE AS deleteRule FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'course_class_makeup_group_members'`,
    )
    expect(cascades).toHaveLength(2)
    expect(cascades.every((row) => row.deleteRule === 'CASCADE')).toBe(true)

    // Both migrations are recorded as applied by Prisma.
    expect(
      await count(
        `SELECT COUNT(*) AS n FROM _prisma_migrations WHERE migration_name IN ('${ATTENDANCE_MIGRATION}', '${GROUP_MIGRATION}') AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
      ),
    ).toBe(2)

    // The generated Prisma Client matches the migrated schema.
    const attendances = await db.attendance.findMany({ orderBy: { attendanceId: 'asc' } })
    expect(attendances.map((row) => [row.status, row.attendanceType])).toEqual([
      ['PRESENT', 'REGULAR'],
      ['ABSENT', 'REGULAR'],
      ['LATE', 'REGULAR'],
      ['PRESENT', 'MAKEUP'],
    ])
    expect(await db.courseClassMakeupGroup.count()).toBe(0)

    // Re-running deploy is a no-op.
    migrateDeploy()
    expect(await count('SELECT COUNT(*) AS n FROM attendances')).toBe(4)
  })
})
