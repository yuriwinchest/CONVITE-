// Script para aplicar a migração de Storage RLS via API do Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://zjmvpvxteixzbnjazplp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbXZwdnh0ZWl4emJuamF6cGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODM4OTMsImV4cCI6MjA3ODM1OTg5M30.OLhncGg-R8shkCHdpX1Qb8PM4Xv3jq81dNu_0JWUmDU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    try {
        console.log('📋 Lendo arquivo de migração...');
        const migrationPath = join(__dirname, 'supabase', 'migrations', '20251127131500_fix_storage_upload_policy.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Aplicando migração...');
        console.log('SQL:', sql);

        // Nota: A chave anon não tem permissão para executar SQL diretamente
        // Você precisará executar isso manualmente no SQL Editor do Supabase Studio
        console.log('\n⚠️  ATENÇÃO: A chave anon não pode executar SQL diretamente.');
        console.log('Por favor, copie o SQL acima e execute no Supabase Studio:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/zjmvpvxteixzbnjazplp/sql/new');
        console.log('2. Cole o SQL');
        console.log('3. Clique em "Run"');

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

applyMigration();
