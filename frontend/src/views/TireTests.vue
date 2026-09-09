<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
      <h1 class="text-2xl font-bold text-petlas-navy">Lastik Test Formu</h1>
      <router-link v-if="auth.isManagerOrAdmin" to="/lastik-testleri/yeni"
        class="bg-petlas-red hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        + Yeni Test Formu
      </router-link>
    </div>
    <p class="text-slate-500 text-sm mb-6">Sahada doldurulan lastik test formlarının dijital kaydı ve arama.</p>

    <div class="bg-white rounded-lg shadow p-4 mb-6 flex gap-3">
      <input v-model="q" @keyup.enter="doSearch" type="text" placeholder="Açıklama, plaka, model veya test no ile ara..."
        class="flex-1 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
      <button @click="doSearch" class="bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded transition-colors">Ara</button>
    </div>

    <p v-if="loading" class="text-slate-500">Aranıyor...</p>
    <p v-else-if="results.length === 0" class="text-slate-500">Sonuç bulunamadı.</p>

    <div class="space-y-3">
      <router-link v-for="t in results" :key="t.id" :to="`/lastik-testleri/${t.id}`"
        class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-red">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-semibold text-petlas-navy">{{ t.aciklama }}</h2>
          <span v-if="t.arac_cinsi" class="text-xs bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ t.arac_cinsi }}</span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          <span v-if="t.plaka">Plaka: {{ t.plaka }} · </span>
          <span v-if="t.arac_no">Araç No: {{ t.arac_no }} · </span>
          <span v-if="t.model">Model: {{ t.model }} · </span>
          <span v-if="t.test_no">Test No: {{ t.test_no }}</span>
          <span v-if="t.hafta"> · Hafta: {{ t.hafta }}</span>
        </p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const q = ref('')
const results = ref([])
const loading = ref(false)

async function doSearch() {
  loading.value = true
  try {
    const res = await api.get('/tire-tests/search', { params: { q: q.value } })
    results.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(doSearch)
</script>
