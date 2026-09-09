<template>
  <div class="min-h-screen flex items-center justify-center bg-petlas-navy px-4">
    <div class="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-5 flex items-center gap-3">
        <img src="../assets/petlas-logo.png" alt="Petlas" class="h-8 bg-white rounded px-1.5 py-1" />
        <div>
          <h1 class="text-white text-lg font-bold leading-tight">Şifremi Unuttum</h1>
          <p class="text-slate-300 text-xs">E-postanıza sıfırlama bağlantısı gönderelim</p>
        </div>
      </div>
      <form v-if="!sent" @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">E-posta Adresi</label>
          <input v-model="email" type="email" required
            class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" :disabled="loading"
          class="w-full bg-petlas-red hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition-colors">
          {{ loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder' }}
        </button>
        <router-link to="/login" class="block text-center text-sm text-petlas-blue hover:underline">Girişe dön</router-link>
      </form>
      <div v-else class="p-6 space-y-3">
        <p class="text-sm text-slate-700">E-posta adresiniz sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.</p>
        <router-link to="/login" class="block text-center text-sm text-petlas-blue hover:underline">Girişe dön</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../api/axios'

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Bir hata oluştu.'
  } finally {
    loading.value = false
  }
}
</script>
