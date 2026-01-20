<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="surface" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-toolbar-title>
        <v-icon icon="mdi-brain" color="primary" class="mr-2" />
        LuzIA Dashboard
      </v-toolbar-title>

      <v-spacer />

      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleLogout">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Sair</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/dashboard"
        />
        <v-list-item
          prepend-icon="mdi-clipboard-text"
          title="Questionários"
          to="/questionarios"
        />
        
        <v-divider class="my-2" />
        
        <v-list-subheader>Administração</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-office-building"
          title="Organizações"
          to="/organizacoes"
        />
        <v-list-item
          prepend-icon="mdi-file-document"
          title="Relatórios"
          to="/relatorios"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <h1 class="text-h4 mb-6">Dashboard</h1>

        <!-- Métricas Principais -->
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Total Questionários</div>
                <div class="text-h4">{{ metrics.totalQuestionarios }}</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Taxa de Resposta</div>
                <div class="text-h4">{{ metrics.taxaResposta }}%</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Nível Médio de Risco</div>
                <div class="text-h4">{{ metrics.nivelMedioRisco }}</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Índice de Proteção</div>
                <div class="text-h4">{{ metrics.indiceProtecao }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Gráficos -->
        <v-row class="mt-4">
          <v-col cols="12" md="8">
            <v-card>
              <v-card-title>Evolução Temporal</v-card-title>
              <v-card-text>
                <Line :data="evolutionData" :options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Distribuição de Risco</v-card-title>
              <v-card-text>
                <Doughnut :data="riskDistribution" :options="doughnutOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Comparativo por Setor</v-card-title>
              <v-card-text>
                <Bar :data="sectorComparison" :options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Tabela de Relatórios Recentes -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Relatórios Recentes</v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="tableHeaders"
                  :items="recentReports"
                  item-key="id"
                >
                  <template #item.riskLevel="{ item }">
                    <v-chip
                      :color="getRiskColor(item.riskLevel)"
                      size="small"
                    >
                      {{ item.riskLevel }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { mockDashboardData } from '@/mocks/dashboard'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(false)

// Mock Data
const metrics = ref(mockDashboardData.metrics)
const evolutionData = ref(mockDashboardData.evolutionData)
const sectorComparison = ref(mockDashboardData.sectorComparison)
const riskDistribution = ref(mockDashboardData.riskDistribution)
const recentReports = ref(mockDashboardData.recentReports)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
    },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const tableHeaders = [
  { title: 'Organização', key: 'organization' },
  { title: 'Setor', key: 'sector' },
  { title: 'Data', key: 'date' },
  { title: 'Tipo', key: 'type' },
  { title: 'Nível de Risco', key: 'riskLevel' },
]

function getRiskColor(level) {
  const colors = {
    Baixo: 'success',
    Médio: 'warning',
    Alto: 'error',
    Crítico: 'error',
  }
  return colors[level] || 'grey'
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.v-card-text canvas {
  max-height: 300px;
}
</style>
