<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <router-link to="/arama" class="text-sm text-petlas-blue hover:underline">&larr; Aramaya dön</router-link>

    <div v-if="doc" class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-4">
        <span class="text-xs bg-petlas-red text-white px-2 py-0.5 rounded font-medium">{{ doc.category || 'Genel' }}</span>
        <span v-if="doc.department && doc.department !== 'GENEL'" class="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-medium ml-1">{{ doc.department === 'SAHA_MUHENDISLIGI' ? 'Saha Mühendisliği' : 'Teknik Servis' }}</span>
        <h1 class="text-white text-xl font-bold mt-2">{{ doc.title }}</h1>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-slate-700 whitespace-pre-line leading-relaxed">{{ doc.content }}</p>
        <div v-if="doc.keywords" class="text-xs text-slate-400">Anahtar kelimeler: {{ doc.keywords }}</div>

        <div v-if="doc.attachments && doc.attachments.length > 0">
          <p class="text-xs font-semibold text-slate-500 mb-2">Ekler</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a v-for="att in doc.attachments" :key="att.id" :href="att.file_path" target="_blank"
              class="block border border-slate-200 rounded overflow-hidden bg-slate-50 hover:shadow transition-shadow">
              <img v-if="isImage(att)" :src="att.file_path" class="w-full h-24 object-cover" />
              <div v-else class="w-full h-24 flex flex-col items-center justify-center text-slate-500">
                <span class="text-2xl">📄</span>
                <span class="text-[10px] px-1 truncate w-full text-center">{{ att.original_name || 'PDF' }}</span>
              </div>
            </a>
          </div>
        </div>

        <a v-else-if="doc.file_path" :href="doc.file_path" target="_blank" class="inline-block text-sm text-petlas-blue hover:underline">📎 Ek dosyayı görüntüle</a>
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

function isImage(att) {
  return (att.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.file_path || '')
}

onMounted(async () => {
  try {
    const res = await api.get(`/documents/${route.params.id}`)
    doc.value = res.data
  } finally {
    loading.value = false
  }
})
</script>
