<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" md="6">
            <v-card elevation="8">
              <v-card-title class="text-h5">
                Em Desenvolvimento
              </v-card-title>
              <v-card-text>
                <p>Esta página ainda está em desenvolvimento.</p>
                <v-btn color="primary" :to="'/dashboard'" class="mt-4">
                  Voltar ao Dashboard
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// Componente placeholder para páginas em desenvolvimento
</script>
