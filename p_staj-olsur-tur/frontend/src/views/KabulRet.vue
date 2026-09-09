<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
      <h1 class="text-2xl font-bold text-petlas-navy">Teknik Servis — Kabul / Ret</h1>
      <router-link v-if="auth.can('CREATE_KABUL_RET')" to="/kabul-ret/yeni"
        class="bg-petlas-red hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        + Yeni Kayıt
      </router-link>
    </div>
    <p class="text-slate-500 text-sm mb-6">Teknik servise gelen lastiklerin kabul/ret değerlendirmesi, hata kodu ve görsel kayıtları.</p>

    <div class="bg-white rounded-lg shadow p-4 mb-6 grid sm:grid-cols-4 gap-3">
      <input v-model="q" @keyup.enter="doSearch" type="text" placeholder="Seri no, müşteri, açıklama..."
        class="sm:col-span-2 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
      <input v-model="hataKodu" @keyup.enter="doSearch" type="text" placeholder="Hata kodu"
        class="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
      <select v-model="karar" @change="doSearch" class="border border-slate-300 rounded px-3 py-2">
        <option value="">Tüm Kararlar</option>
        <option value="BEKLEMEDE">Beklemede</option>
        <option value="KABUL">Kabul</option>
        <option value="RET">Ret</option>
      </select>
      <button @click="doSearch" class="sm:col-span-4 bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded transition-colors">Ara</button>
    </div>

    <p v-if="loading" class="text-slate-500">Aranıyor...</p>
    <p v-else-if="results.length === 0" class="text-slate-500">Sonuç bulunamadı.</p>

    <div class="space-y-3">
      <router-link v-for="k in results" :key="k.id" :to="`/kabul-ret/${k.id}`"
        class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-amber-500">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-semibold text-petlas-navy">{{ k.lastik_seri_no || 'Seri no belirtilmemiş' }}</h2>
          <span class="text-xs px-2 py-0.5 rounded font-medium"
            :class="{ 'bg-green-100 text-green-700': k.karar === 'KABUL', 'bg-red-100 text-red-700': k.karar === 'RET', 'bg-slate-100 text-slate-600': k.karar === 'BEKLEMEDE' }">
            {{ k.karar }}
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          <span v-if="k.musteri">Müşteri: {{ k.musteri }} · </span>
          <span v-if="k.lastik_ebat">Ebat: {{ k.lastik_ebat }} · </span>
          <span v-if="k.hata_kodu">Hata Kodu: {{ k.hata_kodu }}</span>
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
const hataKodu = ref('')
const karar = ref('')
const results = ref([])
const loading = ref(false)

async function doSearch() {
  loading.value = true
  try {
    const res = await api.get('/kabul-ret/search', { params: { q: q.value, hataKodu: hataKodu.value, karar: karar.value } })
    results.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(doSearch)
</script>
