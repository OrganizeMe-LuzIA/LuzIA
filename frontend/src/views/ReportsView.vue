<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4 font-weight-bold">Relatórios</h1>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="generateDialog = true"
          >
            Gerar Relatório
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-alert type="info" variant="tonal" class="mb-4">
          <strong>Dados Mockados:</strong> Estes relatórios são exemplos para
          demonstração enquanto o backend não está implementado.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.organizacao"
                  :items="filterOptions.organizacoes"
                  item-title="nome"
                  item-value="id"
                  label="Organização"
                  clearable
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.setor"
                  :items="filteredSetores"
                  item-title="nome"
                  item-value="id"
                  label="Setor"
                  clearable
                  variant="outlined"
                  density="compact"
                  :disabled="!filters.organizacao"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.tipo"
                  :items="filterOptions.tiposRelatorio"
                  label="Tipo de Relatório"
                  clearable
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Buscar"
                  clearable
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de Relatórios -->
    <v-row>
      <v-col
        v-for="relatorio in filteredReports"
        :key="relatorio.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card elevation="3" class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-file-document</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-1">{{ relatorio.organizacao }}</div>
              <div v-if="relatorio.setor" class="text-caption text-grey">
                {{ relatorio.setor }}
              </div>
            </div>
            <v-chip :color="getStatusColor(relatorio.status)" size="small">
              {{ relatorio.status }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-chip
              :color="getTipoColor(relatorio.tipoRelatorio)"
              size="small"
              class="mb-3"
            >
              {{ getTipoLabel(relatorio.tipoRelatorio) }}
            </v-chip>

            <v-divider class="my-3" />

            <!-- Métricas Resumidas -->
            <div class="d-flex justify-space-between mb-2">
              <span class="text-caption text-grey">Risco Global:</span>
              <v-chip
                :color="getRiscoColor(relatorio.metricas.mediaRiscoGlobal)"
                size="x-small"
              >
                {{ relatorio.metricas.mediaRiscoGlobal.toFixed(1) }}
              </v-chip>
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span class="text-caption text-grey">Proteção:</span>
              <v-chip color="success" size="x-small">
                {{ relatorio.metricas.indiceProtecao.toFixed(1) }}
              </v-chip>
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span class="text-caption text-grey">Respondentes:</span>
              <span class="text-caption font-weight-bold">
                {{ relatorio.metricas.totalRespondentes }}
              </span>
            </div>

            <v-divider class="my-3" />

            <div class="d-flex align-center text-caption text-grey">
              <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
              {{ formatDate(relatorio.dataGeracao) }}
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              color="primary"
              @click="viewReport(relatorio)"
            >
              Ver Detalhes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="filteredReports.length === 0" cols="12">
        <v-card elevation="0" class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
          <p class="text-h6 text-grey mt-4">Nenhum relatório encontrado</p>
          <p class="text-caption text-grey">
            Ajuste os filtros ou gere um novo relatório
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de Visualização de Relatório -->
    <v-dialog v-model="detailDialog" max-width="900" scrollable>
      <v-card v-if="selectedReport">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document</v-icon>
          Detalhes do Relatório
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- Cabeçalho -->
          <div class="mb-6">
            <h2 class="text-h5 mb-2">{{ selectedReport.organizacao }}</h2>
            <div v-if="selectedReport.setor" class="text-subtitle-1 text-grey mb-2">
              Setor: {{ selectedReport.setor }}
            </div>
            <div class="d-flex gap-2 mb-2">
              <v-chip :color="getTipoColor(selectedReport.tipoRelatorio)" size="small">
                {{ getTipoLabel(selectedReport.tipoRelatorio) }}
              </v-chip>
              <v-chip color="grey" size="small">
                {{ formatDate(selectedReport.dataGeracao) }}
              </v-chip>
            </div>
          </div>

          <!-- Métricas Principais -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">Métricas Globais</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <div class="text-center">
                    <div class="text-caption text-grey">Risco Global</div>
                    <div class="text-h4 font-weight-bold">
                      <v-chip
                        :color="getRiscoColor(selectedReport.metricas.mediaRiscoGlobal)"
                        size="large"
                      >
                        {{ selectedReport.metricas.mediaRiscoGlobal.toFixed(1) }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-center">
                    <div class="text-caption text-grey">Índice de Proteção</div>
                    <div class="text-h4 font-weight-bold">
                      <v-chip color="success" size="large">
                        {{ selectedReport.metricas.indiceProtecao.toFixed(1) }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-center">
                    <div class="text-caption text-grey">Total Respondentes</div>
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ selectedReport.metricas.totalRespondentes }}
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Domínios -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">Análise por Domínios</v-card-title>
            <v-card-text>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="(dominio, index) in selectedReport.dominios"
                  :key="index"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                      <span class="flex-grow-1">{{ dominio.nome }}</span>
                      <v-chip
                        :color="getRiscoColor(dominio.media)"
                        size="small"
                        class="mr-2"
                      >
                        {{ dominio.media.toFixed(1) }}
                      </v-chip>
                      <v-chip
                        :color="getNivelRiscoColor(dominio.nivelRisco)"
                        size="small"
                      >
                        {{ dominio.nivelRisco }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-list density="compact">
                      <v-list-item
                        v-for="(dimensao, dimIndex) in dominio.dimensoes"
                        :key="dimIndex"
                      >
                        <template v-slot:prepend>
                          <v-icon size="small">mdi-chevron-right</v-icon>
                        </template>
                        <v-list-item-title>{{ dimensao.nome }}</v-list-item-title>
                        <template v-slot:append>
                          <v-chip
                            :color="getRiscoColor(dimensao.media)"
                            size="x-small"
                            class="mr-2"
                          >
                            {{ dimensao.media.toFixed(1) }}
                          </v-chip>
                          <v-chip
                            :color="getNivelRiscoColor(dimensao.nivelRisco)"
                            size="x-small"
                          >
                            {{ dimensao.nivelRisco }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>

          <!-- Recomendações -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">Recomendações</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(recomendacao, index) in selectedReport.recomendacoes"
                  :key="index"
                >
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-lightbulb</v-icon>
                  </template>
                  <v-list-item-title>{{ recomendacao }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Observações -->
          <v-card v-if="selectedReport.observacoes" variant="outlined">
            <v-card-title class="text-h6">Observações</v-card-title>
            <v-card-text>
              <p>{{ selectedReport.observacoes }}</p>
            </v-card-text>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="detailDialog = false">
            Fechar
          </v-btn>
          <v-btn color="primary" variant="elevated" disabled>
            <v-icon class="mr-2">mdi-download</v-icon>
            Exportar PDF
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Gerar Relatório -->
    <v-dialog v-model="generateDialog" max-width="600">
      <v-card>
        <v-card-title>Gerar Novo Relatório</v-card-title>
        <v-card-text>
          <v-form>
            <v-select
              v-model="newReport.questionario"
              :items="filterOptions.questionarios"
              item-title="nome"
              item-value="id"
              label="Questionário"
              variant="outlined"
              class="mb-3"
            />
            <v-select
              v-model="newReport.tipo"
              :items="filterOptions.tiposRelatorio"
              label="Tipo de Relatório"
              variant="outlined"
              class="mb-3"
            />
            <v-select
              v-model="newReport.organizacao"
              :items="filterOptions.organizacoes"
              item-title="nome"
              item-value="id"
              label="Organização"
              variant="outlined"
              class="mb-3"
            />
            <v-select
              v-model="newReport.setor"
              :items="filteredSetores"
              item-title="nome"
              item-value="id"
              label="Setor (opcional)"
              variant="outlined"
              :disabled="!newReport.organizacao"
              clearable
            />
          </v-form>
          <v-alert type="warning" variant="tonal" class="mt-4">
            <strong>Mock:</strong> Em produção, seria enviado POST /relatorios/gerar
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="generateDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="generateReport"
            :disabled="!newReport.questionario || !newReport.tipo || !newReport.organizacao"
          >
            Gerar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockReports, mockReportFilters } from '@/mocks/reports'

const reports = ref(mockReports)
const filterOptions = ref(mockReportFilters)
const filters = ref({
  organizacao: null,
  setor: null,
  tipo: null,
})
const search = ref('')
const detailDialog = ref(false)
const generateDialog = ref(false)
const selectedReport = ref(null)
const newReport = ref({
  questionario: null,
  tipo: null,
  organizacao: null,
  setor: null,
})

const filteredSetores = computed(() => {
  if (!filters.value.organizacao && !newReport.value.organizacao) return []
  const orgId = filters.value.organizacao || newReport.value.organizacao
  return filterOptions.value.setores.filter((s) => s.idOrganizacao === orgId)
})

const filteredReports = computed(() => {
  let result = reports.value

  if (filters.value.organizacao) {
    result = result.filter((r) => r.idOrganizacao === filters.value.organizacao)
  }

  if (filters.value.setor) {
    result = result.filter((r) => r.idSetor === filters.value.setor)
  }

  if (filters.value.tipo) {
    result = result.filter((r) => r.tipoRelatorio === filters.value.tipo)
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.organizacao.toLowerCase().includes(searchLower) ||
        r.setor?.toLowerCase().includes(searchLower)
    )
  }

  return result
})

function viewReport(relatorio) {
  selectedReport.value = relatorio
  detailDialog.value = true
}

function generateReport() {
  console.log('Gerando relatório:', newReport.value)
  generateDialog.value = false
  // Reset form
  newReport.value = {
    questionario: null,
    tipo: null,
    organizacao: null,
    setor: null,
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusColor(status) {
  return status === 'Concluído' ? 'success' : 'warning'
}

function getTipoColor(tipo) {
  const colors = {
    organizacional: 'primary',
    setorial: 'secondary',
    individual: 'accent',
  }
  return colors[tipo] || 'grey'
}

function getTipoLabel(tipo) {
  const labels = {
    organizacional: 'Organizacional',
    setorial: 'Setorial',
    individual: 'Individual',
  }
  return labels[tipo] || tipo
}

function getRiscoColor(valor) {
  if (valor < 2) return 'success'
  if (valor < 3) return 'info'
  if (valor < 4) return 'warning'
  return 'error'
}

function getNivelRiscoColor(nivel) {
  const colors = {
    Baixo: 'success',
    Médio: 'warning',
    Alto: 'error',
    'Muito Alto': 'error',
  }
  return colors[nivel] || 'grey'
}
</script>
