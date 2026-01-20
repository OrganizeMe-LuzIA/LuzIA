<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">Relatórios</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="mr-2">mdi-file-document</v-icon>
            Relatórios Consolidados
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              Esta seção estará disponível quando o backend implementar os
              endpoints de relatórios.
            </p>
            <v-alert type="info" variant="tonal">
              <strong>Em Desenvolvimento:</strong> A funcionalidade de gerar e
              visualizar relatórios será implementada após a conclusão do
              backend.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// TODO: Implementar quando backend estiver pronto
// - POST /relatorios/gerar - gerar novo relatório
// - GET /relatorios/{id} - visualizar relatório
</script>
