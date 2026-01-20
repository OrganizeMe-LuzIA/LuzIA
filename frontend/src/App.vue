<template>
  <v-app>
    <v-app-bar app elevation="2" color="surface">
      <v-app-bar-title class="ml-4">
        <v-icon icon="mdi-brain" size="large" color="primary" class="mr-2" />
        <span class="text-h5 font-weight-bold">LuzIA</span>
      </v-app-bar-title>

      <v-spacer />

      <!-- TODO: Adicionar quando implementar autenticação
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>Sair</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      -->
    </v-app-bar>

    <v-navigation-drawer app permanent>
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          to="/dashboard"
        />
        <v-list-item
          prepend-icon="mdi-clipboard-list"
          title="Questionários"
          value="questionnaires"
          to="/questionarios"
        />
        <v-list-item
          prepend-icon="mdi-office-building"
          title="Organizações"
          value="organizations"
          to="/organizacoes"
        />
        <v-list-item
          prepend-icon="mdi-file-document"
          title="Relatórios"
          value="reports"
          to="/relatorios"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app>
      <v-container>
        <div class="text-center text-caption">
          LuzIA - Sistema de Avaliação Psicossocial © 2026
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
// Componente principal da aplicação
</script>
