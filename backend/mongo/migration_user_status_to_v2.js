/**
 * Migra status de usuários para os valores canônicos:
 * - finalizado
 * - em andamento
 * - não iniciado
 *
 * Compatibiliza valores legados:
 * - ativo -> em andamento
 * - inativo -> não iniciado
 * - aguardando_confirmacao -> não iniciado
 * - em_andamento -> em andamento
 * - nao_iniciado -> não iniciado
 */

const updates = [
  { from: "ativo", to: "em andamento" },
  { from: "inativo", to: "não iniciado" },
  { from: "aguardando_confirmacao", to: "não iniciado" },
  { from: "em_andamento", to: "em andamento" },
  { from: "nao_iniciado", to: "não iniciado" },
];

updates.forEach(({ from, to }) => {
  const result = db.usuarios.updateMany({ status: from }, { $set: { status: to } });
  print(`status '${from}' -> '${to}': matched=${result.matchedCount} modified=${result.modifiedCount}`);
});

