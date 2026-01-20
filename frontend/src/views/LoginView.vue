<template>
  <v-container fluid class="fill-height login-container">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="12" class="pa-4">
          <v-card-title class="text-h4 text-center mb-4">
            <v-icon icon="mdi-brain" size="48" color="primary" class="mr-2" />
            LuzIA
          </v-card-title>
          
          <v-card-subtitle class="text-center mb-6">
            Sistema de Avaliação Psicossocial
          </v-card-subtitle>

          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <!-- Campo de Telefone -->
              <v-text-field
                v-model="phone"
                label="Telefone"
                placeholder="+55 11 99999-9999"
                prepend-inner-icon="mdi-phone"
                variant="outlined"
                :disabled="loading"
                :error-messages="phoneError"
                class="mb-4"
              />

              <!-- Botão Solicitar Código -->
              <v-btn
                v-if="!showCodeInput"
                color="secondary"
                variant="outlined"
                block
                :loading="loading"
                @click="handleRequestOTP"
                class="mb-4"
              >
                <v-icon start>mdi-message-text</v-icon>
                Solicitar Código
              </v-btn>

              <!-- Campo de Código OTP -->
              <v-text-field
                v-if="showCodeInput"
                v-model="code"
                label="Código OTP"
                placeholder="123456"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                :disabled="loading"
                :error-messages="codeError"
                class="mb-4"
              />

              <!-- Botão Entrar -->
              <v-btn
                v-if="showCodeInput"
                color="primary"
                block
                size="large"
                type="submit"
                :loading="loading"
              >
                <v-icon start>mdi-login</v-icon>
                Entrar
              </v-btn>

              <!-- Mensagem de Erro -->
              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                class="mt-4"
              >
                {{ authStore.error }}
              </v-alert>

              <!-- Mensagem de Sucesso ao enviar OTP -->
              <v-alert
                v-if="otpSent"
                type="success"
                variant="tonal"
                class="mt-4"
              >
                Código enviado via WhatsApp!
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const code = ref('')
const showCodeInput = ref(false)
const otpSent = ref(false)
const phoneError = ref('')
const codeError = ref('')
const loading = ref(false)

async function handleRequestOTP() {
  phoneError.value = ''
  
  if (!phone.value) {
    phoneError.value = 'Digite seu telefone'
    return
  }

  try {
    loading.value = true
    await authStore.sendOTP(phone.value)
    showCodeInput.value = true
    otpSent.value = true
  } catch (error) {
    console.error('Erro ao solicitar OTP:', error)
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  codeError.value = ''
  
  if (!code.value) {
    codeError.value = 'Digite o código recebido'
    return
  }

  try {
    loading.value = true
    await authStore.login(phone.value, code.value)
    router.push('/dashboard')
  } catch (error) {
    console.error('Erro ao fazer login:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
