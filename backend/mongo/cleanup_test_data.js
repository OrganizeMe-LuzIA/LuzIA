/*
 * Limpeza de dados de teste do COPSOQ
 * 
 * Remove todos os dados criados durante testes com o frontend.
 * Identifica dados de teste pelo prefixo "TEST_" no anonId.
 * 
 * Uso: mongosh LuzIA < cleanup_test_data.js
 *      OU via Docker: docker exec -i luzia-mongo mongosh LuzIA < cleanup_test_data.js
 */

print("🧹 Iniciando limpeza de dados de teste...\n");

// Prefixo usado para identificar dados de teste
const TEST_PREFIX = /^TEST_/;

// 1. Contar dados antes
const countRespostasBefore = db.respostas.countDocuments({ anonId: TEST_PREFIX });
const countDiagnosticosBefore = db.diagnosticos.countDocuments({ anonId: TEST_PREFIX });
const countUsuariosBefore = db.usuarios.countDocuments({ anonId: TEST_PREFIX });

print("📊 Dados de teste encontrados:");
print("   - Respostas: " + countRespostasBefore);
print("   - Diagnósticos: " + countDiagnosticosBefore);
print("   - Usuários: " + countUsuariosBefore);
print("");

if (countRespostasBefore + countDiagnosticosBefore + countUsuariosBefore === 0) {
    print("✅ Nenhum dado de teste encontrado. Banco limpo!");
} else {
    // 2. Remover dados de teste
    print("🗑️  Removendo dados de teste...\n");

    const respostasResult = db.respostas.deleteMany({ anonId: TEST_PREFIX });
    print("   Respostas removidas: " + respostasResult.deletedCount);

    const diagnosticosResult = db.diagnosticos.deleteMany({ anonId: TEST_PREFIX });
    print("   Diagnósticos removidos: " + diagnosticosResult.deletedCount);

    const usuariosResult = db.usuarios.deleteMany({ anonId: TEST_PREFIX });
    print("   Usuários removidos: " + usuariosResult.deletedCount);

    print("");
    print("✅ Limpeza concluída com sucesso!");
}

// 3. Mostrar estatísticas finais
print("\n📈 Estatísticas atuais do banco:");
print("   - Total de usuários: " + db.usuarios.countDocuments({}));
print("   - Total de respostas: " + db.respostas.countDocuments({}));
print("   - Total de diagnósticos: " + db.diagnosticos.countDocuments({}));
print("   - Total de questionários: " + db.questionarios.countDocuments({}));
print("");
