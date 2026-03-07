import './assets/css/main.css'

import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

import App from './App.vue'
import { supabase } from './lib/supabase'

const app = createApp(App)

const router = createRouter({
  routes,
  history: createWebHistory(),
})

router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  if (to.path === '/login') {
    if (data.session) return '/'
    return true
  }
  if (!data.session) return '/login'
  return true
})

app.use(router)
app.use(ui)

app.mount('#app')

if (import.meta.hot) {
  handleHotUpdate(router)
}
