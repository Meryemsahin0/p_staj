<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <router-link to="/anasayfa" class="text-sm text-petlas-blue hover:underline">&larr; Ana sayfaya dön</router-link>
    <h1 class="text-2xl font-bold text-petlas-navy mt-3 mb-6">Petlas Gündem</h1>

    <p v-if="loading" class="text-slate-500">Yükleniyor...</p>
    <p v-else-if="haberler.length === 0" class="text-slate-500">Henüz haber yayınlanmadı.</p>

    <div class="space-y-3">
      <router-link v-for="h in haberler" :key="h.id" :to="`/gundem/${h.id}`"
        class="flex gap-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
        <img v-if="h.gorsel_url" :src="h.gorsel_url" class="w-24 h-24 rounded object-cover shrink-0" />
        <div class="min-w-0">
          <h2 class="font-semibold text-petlas-navy">{{ h.baslik }}</h2>
          <p class="text-xs text-slate-400 mb-1">{{ new Date(h.created_at).toLocaleDateString('tr-TR') }}</p>
          <p class="text-sm text-slate-500 line-clamp-2">{{ h.icerik }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const haberler = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/haberler')
    haberler.value = res.data
  } finally {
    loading.value = false
  }
})
</script>
