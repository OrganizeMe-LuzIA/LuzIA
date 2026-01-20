<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">Questionários</h1>
      </v-col>
    </v-row>

    <!-- Lista de Questionários Disponíveis -->
    <v-row v-if="!selectedQuestionnaire">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" class="mb-4">
          <strong>Dados Mockados:</strong> Estes questionários são exemplos para
          demonstração enquanto o backend não está implementado.
        </v-alert>
      </v-col>

      <v-col
        v-for="questionario in questionnaires"
        :key="questionario.id"
        cols="12"
        md="6"
      >
        <v-card elevation="3" :class="questionario.ativo ? '' : 'opacity-60'">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-clipboard-list</v-icon>
            {{ questionario.nome }}
            <v-spacer />
            <v-chip
              :color="questionario.ativo ? 'success' : 'grey'"
              size="small"
            >
              {{ questionario.ativo ? 'Ativo' : 'Inativo' }}
            </v-chip>
          </v-card-title>

          <v-card-subtitle>
            Versão {{ questionario.versao }}
          </v-card-subtitle>

          <v-card-text>
            <p class="text-body-2 mb-3">{{ questionario.descricao }}</p>

            <v-divider class="my-3" />

            <div class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2">mdi-format-list-numbered</v-icon>
              <span class="text-caption">
                {{ questionario.totalPerguntas }} perguntas
              </span>
            </div>

            <div class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2">mdi-chart-box</v-icon>
              <span class="text-caption">
                {{ questionario.dominios.length }} domínios
              </span>
            </div>

            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-scale-balance</v-icon>
              <span class="text-caption">{{ questionario.escala }}</span>
            </div>

            <v-expansion-panels class="mt-3" variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <span class="text-caption">Ver Domínios</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-chip
                    v-for="(dominio, index) in questionario.dominios"
                    :key="index"
                    class="ma-1"
                    size="small"
                    variant="outlined"
                  >
                    {{ dominio }}
                  </v-chip>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="elevated"
              @click="startQuestionnaire(questionario)"
              :disabled="!questionario.ativo"
            >
              <v-icon class="mr-2">mdi-play</v-icon>
              Iniciar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Aplicação do Questionário -->
    <v-row v-else>
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title class="d-flex align-center">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="selectedQuestionnaire = null"
              class="mr-2"
            />
            {{ selectedQuestionnaire.nome }}
          </v-card-title>

          <v-card-text>
            <!-- Progress -->
            <v-progress-linear
              :model-value="progress"
              color="primary"
              height="8"
              class="mb-4"
            />
            <div class="text-center text-caption mb-4">
              Pergunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}
            </div>

            <!-- Pergunta Atual -->
            <v-card
              v-if="currentQuestion"
              variant="outlined"
              class="pa-4 mb-4"
            >
              <div class="text-overline text-primary mb-2">
                {{ currentQuestion.dominio }}
                <span v-if="currentQuestion.dimensao">
                  › {{ currentQuestion.dimensao }}
                </span>
              </div>

              <h3 class="text-h6 mb-4">{{ currentQuestion.texto }}</h3>

              <v-radio-group v-model="currentAnswer" class="mt-4">
                <v-radio
                  v-for="opcao in currentQuestion.opcoes"
                  :key="opcao.valor"
                  :label="opcao.label"
                  :value="opcao.valor"
                  color="primary"
                />
              </v-radio-group>
            </v-card>

            <!-- Navegação -->
            <div class="d-flex justify-space-between">
              <v-btn
                variant="outlined"
                @click="previousQuestion"
                :disabled="currentQuestionIndex === 0"
              >
                <v-icon class="mr-2">mdi-chevron-left</v-icon>
                Anterior
              </v-btn>

              <v-btn
                v-if="currentQuestionIndex < questions.length - 1"
                color="primary"
                variant="elevated"
                @click="nextQuestion"
                :disabled="currentAnswer === null"
              >
                Próxima
                <v-icon class="ml-2">mdi-chevron-right</v-icon>
              </v-btn>

              <v-btn
                v-else
                color="success"
                variant="elevated"
                @click="submitQuestionnaire"
                :disabled="currentAnswer === null"
              >
                <v-icon class="mr-2">mdi-check</v-icon>
                Concluir
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de Confirmação -->
    <v-dialog v-model="successDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 text-center">
          <v-icon color="success" size="64" class="mb-2">
            mdi-check-circle
          </v-icon>
          <div>Questionário Concluído!</div>
        </v-card-title>
        <v-card-text class="text-center">
          <p>Suas respostas foram registradas com sucesso.</p>
          <p class="text-caption text-grey">
            (Mock: Em produção, seria enviado para POST /respostas)
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="closeSuccess">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockQuestionnaires, mockQuestions } from '@/mocks/questionnaires'

const questionnaires = ref(mockQuestionnaires)
const selectedQuestionnaire = ref(null)
const questions = ref([])
const currentQuestionIndex = ref(0)
const answers = ref({})
const currentAnswer = ref(null)
const successDialog = ref(false)

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

function startQuestionnaire(questionario) {
  selectedQuestionnaire.value = questionario
  questions.value = mockQuestions[questionario.id] || []
  currentQuestionIndex.value = 0
  answers.value = {}
  currentAnswer.value = null
}

function nextQuestion() {
  if (currentAnswer.value !== null) {
    answers.value[currentQuestion.value.idPergunta] = currentAnswer.value
    currentQuestionIndex.value++
    currentAnswer.value = answers.value[currentQuestion.value?.idPergunta] ?? null
  }
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    answers.value[currentQuestion.value.idPergunta] = currentAnswer.value
    currentQuestionIndex.value--
    currentAnswer.value = answers.value[currentQuestion.value?.idPergunta] ?? null
  }
}

function submitQuestionnaire() {
  if (currentAnswer.value !== null) {
    answers.value[currentQuestion.value.idPergunta] = currentAnswer.value
  }

  console.log('Respostas coletadas:', {
    idQuestionario: selectedQuestionnaire.value.id,
    respostas: Object.entries(answers.value).map(([idPergunta, valor]) => ({
      idPergunta,
      valor,
    })),
  })

  successDialog.value = true
}

function closeSuccess() {
  successDialog.value = false
  selectedQuestionnaire.value = null
  questions.value = []
  answers.value = {}
  currentQuestionIndex.value = 0
  currentAnswer.value = null
}
</script>
