<template>
  <div class="min-h-screen flex items-center justify-center bg-petlas-navy px-4">
    <div class="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-5 flex items-center gap-3">
        <img src="../assets/petlas-logo.png" alt="Petlas" class="h-8 bg-white rounded px-1.5 py-1" />
        <div>
          <h1 class="text-white text-lg font-bold leading-tight">Şifre Sıfırlama</h1>
          <p class="text-slate-300 text-xs">Yeni şifrenizi belirleyin</p>
        </div>
      </div>
      <form v-if="!done" @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
          <input v-model="newPassword" type="password" required minlength="6"
            class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre (Tekrar)</label>
          <input v-model="newPassword2" type="password" required minlength="6"
            class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" :disabled="loading"
          class="w-full bg-petlas-red hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition-colors">
          {{ loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle' }}
        </button>
      </form>
      <div v-else class="p-6 space-y-3">
        <p class="text-sm text-green-600">Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.</p>
        <router-link to="/login" class="block text-center text-sm text-petlas-blue hover:underline">Girişe git</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const newPassword = ref('')
const newPassword2 = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function handleSubmit() {
  error.value = ''
  if (newPassword.value !== newPassword2.value) {
    error.value = 'Şifreler eşleşmiyor.'
    return
  }
  loading.value = true
  try {
    await api.post('/auth/reset-password', {
      email: route.query.email,
      token: route.query.token,
      newPassword: newPassword.value
    })
    done.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Bir hata oluştu.'
  } finally {
    loading.value = false
  }
}
</script>
