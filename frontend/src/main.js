// Plugins
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import router from './router'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
