<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Hızlı Arama</h1>
    <p class="text-slate-500 text-sm mb-6">Tork değerleri, basınç tabloları, arıza çözümleri ve daha fazlasını ara.</p>

    <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <input v-model="q" @keyup.enter="doSearch" type="text" placeholder="Anahtar kelime ile ara (örn: tork, basınç, jant)..."
        class="flex-1 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
      <select v-model="category" @change="doSearch" class="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red">
        <option value="">Tüm Kategoriler</option>
        <option v-for="c in categories" :key="c.id" :value="c.category_name">{{ c.category_name }}</option>
      </select>
      <button @click="doSearch" class="bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded transition-colors">Ara</button>
    </div>

    <p v-if="loading" class="text-slate-500">Aranıyor...</p>
    <p v-else-if="results.length === 0" class="text-slate-500">Sonuç bulunamadı. Farklı bir anahtar kelime deneyin.</p>

    <div class="space-y-3">
      <router-link v-for="doc in results" :key="doc.id" :to="`/dokuman/${doc.id}`"
        class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-red">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-petlas-navy">{{ doc.title }}</h2>
          <span class="text-xs bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ doc.category || 'Genel' }}</span>
        </div>
        <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ doc.content }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const q = ref('')
const category = ref('')
const results = ref([])
const categories = ref([])
const loading = ref(false)

async function loadCategories() {
  const res = await api.get('/categories')
  categories.value = res.data
}

async function doSearch() {
  loading.value = true
  try {
    const res = await api.get('/documents/search', { params: { q: q.value, category: category.value } })
    results.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  doSearch()
})
</script>
