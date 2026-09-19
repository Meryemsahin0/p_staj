<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <router-link to="/gundem" class="text-sm text-petlas-blue hover:underline">&larr; Tüm haberler</router-link>

    <div v-if="haber" class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <img v-if="haber.gorsel_url" :src="haber.gorsel_url" class="w-full h-56 object-cover" />
      <div class="p-6">
        <h1 class="text-xl font-bold text-petlas-navy mb-1">{{ haber.baslik }}</h1>
        <p class="text-xs text-slate-400 mb-4">{{ new Date(haber.created_at).toLocaleDateString('tr-TR') }}</p>
        <p class="text-slate-700 whitespace-pre-line leading-relaxed">{{ haber.icerik }}</p>
      </div>
    </div>
    <p v-else-if="loading" class="text-slate-500 mt-4">Yükleniyor...</p>
    <p v-else class="text-slate-500 mt-4">Haber bulunamadı.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const haber = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get(`/haberler/${route.params.id}`)
    haber.value = res.data
  } finally {
    loading.value = false
  }
})
</script>
