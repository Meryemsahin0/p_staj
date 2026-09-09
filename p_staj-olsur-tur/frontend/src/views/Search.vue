<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Anasayfa — Hızlı Arama</h1>
    <p class="text-slate-500 text-sm mb-6">Tork değerleri, basınç tabloları, saha mühendisliği kayıtları, teknik servis kayıtları ve hata koduna göre arama.</p>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Sol: Arama + Sonuçlar -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow p-4 space-y-3">
          <div class="flex flex-col sm:flex-row gap-3">
            <input v-model="q" @keyup.enter="doSearch" type="text" placeholder="Anahtar kelime ile ara..."
              class="flex-1 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
            <select v-model="category" @change="doSearch" class="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red">
              <option value="">Tüm Kategoriler</option>
              <option v-for="c in categories" :key="c.id" :value="c.category_name">{{ c.category_name }}</option>
            </select>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <input v-model="hataKodu" @keyup.enter="doSearch" type="text" placeholder="Hata kodu ile ara (örn: E102)..."
              class="flex-1 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
            <button @click="doSearch" class="bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded transition-colors">Ara</button>
          </div>
        </div>

        <p v-if="loading" class="text-slate-500">Aranıyor...</p>

        <!-- Dokümanlar -->
        <div v-if="auth.can('VIEW_DOCUMENTS')">
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2">📄 Dokümanlar</h2>
          <p v-if="!loading && docResults.length === 0" class="text-slate-400 text-sm mb-4">Sonuç bulunamadı.</p>
          <div class="space-y-2 mb-4">
            <router-link v-for="doc in docResults" :key="'doc-'+doc.id" :to="`/dokuman/${doc.id}`"
              class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-red">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h3 class="font-semibold text-petlas-navy">{{ doc.title }}</h3>
                <div class="flex gap-1">
                  <span class="text-xs bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ doc.category || 'Genel' }}</span>
                  <span v-if="doc.department && doc.department !== 'GENEL'" class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">{{ doc.department === 'SAHA_MUHENDISLIGI' ? 'Saha Müh.' : 'Teknik Servis' }}</span>
                </div>
              </div>
              <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ doc.content }}</p>
            </router-link>
          </div>
        </div>

        <!-- Saha Mühendisliği -->
        <div v-if="auth.can('VIEW_TIRE_TESTS')">
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2">🚛 Saha Mühendisliği Kayıtları</h2>
          <p v-if="!loading && tireResults.length === 0" class="text-slate-400 text-sm mb-4">Sonuç bulunamadı.</p>
          <div class="space-y-2 mb-4">
            <router-link v-for="t in tireResults" :key="'tt-'+t.id" :to="`/lastik-testleri/${t.id}`"
              class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-navy">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h3 class="font-semibold text-petlas-navy">{{ t.aciklama }}</h3>
              </div>
              <p class="text-sm text-slate-500 mt-1">
                <span v-if="t.plaka">Plaka: {{ t.plaka }} · </span>
                <span v-if="t.model">Model: {{ t.model }} · </span>
                <span v-if="t.test_no">Test No: {{ t.test_no }}</span>
              </p>
            </router-link>
          </div>
        </div>

        <!-- Teknik Servis -->
        <div v-if="auth.can('VIEW_KABUL_RET')">
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2">🛞 Teknik Servis Kayıtları</h2>
          <p v-if="!loading && kabulRetResults.length === 0" class="text-slate-400 text-sm mb-4">Sonuç bulunamadı.</p>
          <div class="space-y-2 mb-4">
            <router-link v-for="k in kabulRetResults" :key="'kr-'+k.id" :to="`/kabul-ret/${k.id}`"
              class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-amber-500">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h3 class="font-semibold text-petlas-navy">{{ k.lastik_seri_no || 'Seri no belirtilmemiş' }}</h3>
                <div class="flex gap-1">
                  <span v-if="k.hata_kodu" class="text-xs bg-red-100 text-petlas-red px-2 py-0.5 rounded font-medium">Hata: {{ k.hata_kodu }}</span>
                  <span class="text-xs px-2 py-0.5 rounded font-medium"
                    :class="{ 'bg-green-100 text-green-700': k.karar === 'KABUL', 'bg-red-100 text-red-700': k.karar === 'RET', 'bg-slate-100 text-slate-600': k.karar === 'BEKLEMEDE' }">
                    {{ k.karar }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-slate-500 mt-1">
                <span v-if="k.musteri">Müşteri: {{ k.musteri }} · </span>
                <span v-if="k.lastik_ebat">Ebat: {{ k.lastik_ebat }}</span>
              </p>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Sağ: İstatistikler (tüm kullanıcılara açık) -->
      <div class="space-y-8">
        <BarChart title="Saha Mühendisliği — En Çok Kayıtlı 4 Firma" :data="fieldEngineeringStats" color="#0f172a" />
        <BarChart title="Teknik Servis — Hata Koduna Göre Lastik Sayısı" :data="errorCodeStats" color="#dc2626" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'
import BarChart from '../components/BarChart.vue'

const auth = useAuthStore()

const q = ref('')
const category = ref('')
const hataKodu = ref('')
const categories = ref([])
const loading = ref(false)

const docResults = ref([])
const tireResults = ref([])
const kabulRetResults = ref([])

const errorCodeStats = ref([])
const fieldEngineeringStats = ref([])

async function loadCategories() {
  try {
    const res = await api.get('/categories')
    categories.value = res.data
  } catch { /* kategori yüklenemezse arama yine çalışsın */ }
}

async function doSearch() {
  loading.value = true
  try {
    const jobs = []

    if (auth.can('VIEW_DOCUMENTS')) {
      jobs.push(
        api.get('/documents/search', { params: { q: q.value, category: category.value, hataKodu: hataKodu.value } })
          .then(res => { docResults.value = res.data })
          .catch(() => { docResults.value = [] })
      )
    }
    if (auth.can('VIEW_TIRE_TESTS')) {
      jobs.push(
        api.get('/tire-tests/search', { params: { q: q.value } })
          .then(res => { tireResults.value = res.data })
          .catch(() => { tireResults.value = [] })
      )
    }
    if (auth.can('VIEW_KABUL_RET')) {
      jobs.push(
        api.get('/kabul-ret/search', { params: { q: q.value, hataKodu: hataKodu.value } })
          .then(res => { kabulRetResults.value = res.data })
          .catch(() => { kabulRetResults.value = [] })
      )
    }

    await Promise.all(jobs)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await api.get('/stats/overview')
    errorCodeStats.value = res.data.errorCodeStats.map(r => ({ label: r.label, count: r.count }))
    fieldEngineeringStats.value = res.data.fieldEngineeringStats.map(r => ({ label: r.label, count: r.count }))
  } catch { /* istatistik yüklenemezse sayfanın kalanı etkilenmesin */ }
}

onMounted(() => {
  loadCategories()
  doSearch()
  loadStats()
})
</script>
