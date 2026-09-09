<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <router-link to="/arama" class="text-sm text-petlas-blue hover:underline">&larr; Aramaya dön</router-link>

    <div v-if="doc" class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-4">
        <span class="text-xs bg-petlas-red text-white px-2 py-0.5 rounded font-medium">{{ doc.category || 'Genel' }}</span>
        <h1 class="text-white text-xl font-bold mt-2">{{ doc.title }}</h1>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-slate-700 whitespace-pre-line leading-relaxed">{{ doc.content }}</p>
        <div v-if="doc.keywords" class="text-xs text-slate-400">Anahtar kelimeler: {{ doc.keywords }}</div>
        <a v-if="doc.file_path" :href="doc.file_path" target="_blank" class="inline-block text-sm text-petlas-blue hover:underline">📎 Ek dosyayı görüntüle</a>
      </div>
    </div>
    <p v-else-if="loading" class="text-slate-500 mt-4">Yükleniyor...</p>
    <p v-else class="text-slate-500 mt-4">Doküman bulunamadı.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const doc = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get(`/documents/${route.params.id}`)
    doc.value = res.data
  } finally {
    loading.value = false
  }
})
</script>
