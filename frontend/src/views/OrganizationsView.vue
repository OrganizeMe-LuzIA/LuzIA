<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4 font-weight-bold">Organizações</h1>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
            Nova Organização
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar organizações"
              single-line
              hide-details
              clearable
              variant="outlined"
              density="compact"
            />
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="organizations"
              :search="search"
              :items-per-page="10"
              class="elevation-0"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="viewOrganization(item)"
                />
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="editOrganization(item)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para nova/editar organização -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.nome"
                  label="Nome da Organização"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.cnpj"
                  label="CNPJ"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="close"> Cancelar </v-btn>
          <v-btn color="primary" variant="elevated" @click="save"> Salvar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const dialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  nome: '',
  cnpj: '',
})

const defaultItem = {
  nome: '',
  cnpj: '',
}

// Mock data - substituir com chamada API
const organizations = ref([
  { id: 1, nome: 'Empresa ABC Ltda', cnpj: '12.345.678/0001-90', setores: 5 },
  { id: 2, nome: 'Organização XYZ S.A.', cnpj: '98.765.432/0001-10', setores: 3 },
  {
    id: 3,
    nome: 'Instituto de Pesquisa',
    cnpj: '11.222.333/0001-44',
    setores: 8,
  },
])

const headers = [
  { title: 'Nome', key: 'nome', sortable: true },
  { title: 'CNPJ', key: 'cnpj', sortable: true },
  { title: 'Setores', key: 'setores', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false },
]

const formTitle = computed(() => {
  return editedIndex.value === -1
    ? 'Nova Organização'
    : 'Editar Organização'
})

function viewOrganization(item) {
  console.log('Visualizar:', item)
  // TODO: Navegar para página de detalhes ou abrir modal
}

function editOrganization(item) {
  editedIndex.value = organizations.value.indexOf(item)
  editedItem.value = Object.assign({}, item)
  dialog.value = true
}

function close() {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = Object.assign({}, defaultItem)
    editedIndex.value = -1
  }, 300)
}

function save() {
  if (editedIndex.value > -1) {
    // Editar existente
    Object.assign(organizations.value[editedIndex.value], editedItem.value)
  } else {
    // Criar nova
    organizations.value.push({
      ...editedItem.value,
      id: organizations.value.length + 1,
      setores: 0,
    })
  }
  close()
  // TODO: Fazer POST/PUT para API
}
</script>
