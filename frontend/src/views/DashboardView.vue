<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Métricas Principais -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="primary" class="mr-4">
                mdi-clipboard-check
              </v-icon>
              <div>
                <div class="text-caption text-grey">Total de Questionários</div>
                <div class="text-h4 font-weight-bold">
                  {{ metrics.totalQuestionarios }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="success" class="mr-4">
                mdi-chart-line
              </v-icon>
              <div>
                <div class="text-caption text-grey">Taxa de Resposta</div>
                <div class="text-h4 font-weight-bold">
                  {{ metrics.taxaResposta }}%
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="warning" class="mr-4">
                mdi-alert-circle
              </v-icon>
              <div>
                <div class="text-caption text-grey">Nível Médio de Risco</div>
                <div class="text-h4 font-weight-bold">
                  {{ metrics.nivelMedioRisco.toFixed(1) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="info" class="mr-4">
                mdi-shield-check
              </v-icon>
              <div>
                <div class="text-caption text-grey">Índice de Proteção</div>
                <div class="text-h4 font-weight-bold">
                  {{ metrics.indiceProtecao.toFixed(1) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gráficos -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card elevation="3">
          <v-card-title>Evolução Temporal</v-card-title>
          <v-card-text>
            <Line :data="evolutionChartData" :options="lineChartOptions" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="3">
          <v-card-title>Comparativo por Setor</v-card-title>
          <v-card-text>
            <Bar :data="setoresChartData" :options="barChartOptions" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela de Relatórios Recentes -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title>Relatórios Recentes</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="tableHeaders"
              :items="relatorios"
              :items-per-page="5"
              class="elevation-0"
            >
              <template v-slot:item.risco="{ item }">
                <v-chip
                  :color="getRiscoColor(item.risco)"
                  small
                  text-color="white"
                >
                  {{ item.risco.toFixed(1) }}
                </v-chip>
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip color="success" small>
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

import {
  mockDashboardMetrics,
  mockEvolution,
  mockSetoresComparativo,
  mockRelatoriosRecentes,
} from '@/mocks/dashboard'

// Registrar componentes Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Dados reativos
const metrics = ref(mockDashboardMetrics)
const relatorios = ref(mockRelatoriosRecentes)

// Headers da tabela
const tableHeaders = [
  { title: 'Tipo', key: 'tipo' },
  { title: 'Organização', key: 'organizacao' },
  { title: 'Setor', key: 'setor' },
  { title: 'Data', key: 'data' },
  { title: 'Risco', key: 'risco' },
  { title: 'Status', key: 'status' },
]

// Dados do gráfico de evolução
const evolutionChartData = {
  labels: mockEvolution.map((d) => d.mes),
  datasets: [
    {
      label: 'Risco',
      data: mockEvolution.map((d) => d.risco),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4,
    },
    {
      label: 'Proteção',
      data: mockEvolution.map((d) => d.protecao),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    },
  ],
}

// Dados do gráfico de setores
const setoresChartData = {
  labels: mockSetoresComparativo.map((d) => d.setor),
  datasets: [
    {
      label: 'Nível de Risco',
      data: mockSetoresComparativo.map((d) => d.risco),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
    },
  ],
}

// Opções dos gráficos
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
    },
  },
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
    },
  },
}

// Função auxiliar para cor de risco
function getRiscoColor(risco) {
  if (risco < 2) return 'success'
  if (risco < 3) return 'info'
  if (risco < 4) return 'warning'
  return 'error'
}
</script>
