<template>
  <div class="min-h-screen flex items-center justify-center bg-petlas-navy px-4">
    <div class="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-5 flex items-center gap-3">
        <img src="../assets/petlas-logo.png" alt="Petlas" class="h-8 bg-white rounded px-1.5 py-1" />
        <div>
          <h1 class="text-white text-lg font-bold leading-tight">PETLAS</h1>
          <p class="text-slate-300 text-xs">SSH Bilgi Tabanı</p>
        </div>
      </div>
      <form @submit.prevent="handleLogin" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı</label>
          <input v-model="username" type="text" required autocomplete="username"
            class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
          <input v-model="password" type="password" required autocomplete="current-password"
            class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" :disabled="loading"
          class="w-full bg-petlas-red hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition-colors">
          {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </button>
        <router-link to="/sifremi-unuttum" class="block text-center text-sm text-petlas-blue hover:underline">Şifremi Unuttum</router-link>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const auth = useAuthStore()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', { username: username.value, password: password.value })
    auth.setSession({
      token: res.data.token,
      refreshToken: res.data.refreshToken,
      user: res.data.user
    })
    router.push('/anasayfa')
  } catch (err) {
    error.value = err.response?.data?.error || 'Giriş başarısız oldu.'
  } finally {
    loading.value = false
  }
}
</script>
