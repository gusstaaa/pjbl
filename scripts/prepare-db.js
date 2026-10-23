#!/usr/bin/env node
/**
 * Ajusta automaticamente o provider do Prisma (sqlite em dev local / postgresql em produção)
 * com base no protocolo da variável DATABASE_URL (REQUISITOS.md §10).
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const envPath = path.join(rootDir, '.env');

let dbUrl = process.env.DATABASE_URL || '';

if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
  if (match) {
    dbUrl = match[1];
  }
}

let targetProvider = 'sqlite';
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  targetProvider = 'postgresql';
} else if (dbUrl.startsWith('file:')) {
  targetProvider = 'sqlite';
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const updatedContent = schemaContent.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

if (schemaContent !== updatedContent) {
  fs.writeFileSync(schemaPath, updatedContent, 'utf8');
  console.log(`[prepare-db] Provider do Prisma ajustado para "${targetProvider}".`);
} else {
  console.log(`[prepare-db] Provider do Prisma já está configurado como "${targetProvider}".`);
}
