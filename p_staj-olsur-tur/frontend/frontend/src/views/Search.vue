<template>
  <div class="max-w-[1600px] mx-auto px-6 py-6">
    <!-- Üst: 3 sütun -->
    <div class="grid md:grid-cols-3 gap-5 mb-6">
      <!-- Sol: şu an takılı lastik sayısı -->
      <div class="bg-white rounded-lg shadow p-7 flex items-center justify-between gap-4">
        <p class="text-petlas-navy leading-snug text-lg">
          <span class="font-extrabold italic text-3xl">{{ sayaclar.arac_sayisi ?? 0 }}</span>
          araçta toplam
          <span class="font-extrabold italic text-3xl">{{ sayaclar.lastik_sayisi ?? 0 }}</span>
          lastiğimiz yollarda!
        </p>
        <svg viewBox="0 0 100 100" class="w-20 h-20 shrink-0 spin-slow">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#0F172A" stroke-width="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#0F172A" stroke-width="10" stroke-dasharray="6 8" />
          <circle cx="50" cy="50" r="14" fill="#0F172A" />
          <circle cx="50" cy="50" r="4" fill="white" />
        </svg>
      </div>

      <!-- Orta: kaç ilde test yapılıyor -->
      <div class="bg-white rounded-lg shadow p-7 flex items-center justify-between gap-4">
        <p class="text-petlas-navy leading-snug text-lg">
          <span class="font-extrabold italic text-3xl">{{ sayaclar.il_sayisi ?? 0 }}</span>
          ilimizde lastiklerimizi test ediyoruz!
        </p>
        <svg viewBox="0 0 64 64" class="w-20 h-20 shrink-0">
          <rect x="4" y="4" width="56" height="56" rx="8" fill="#DC2626" />
          <circle cx="26" cy="32" r="12" fill="white" />
          <circle cx="30" cy="32" r="9.5" fill="#DC2626" />
          <polygon points="42,24 44.2,30.5 51,30.5 45.5,34.6 47.6,41 42,37 36.4,41 38.5,34.6 33,30.5 39.8,30.5"
            fill="white" transform="translate(-2,0)" />
        </svg>
      </div>

      <!-- Sağ: en çok kayıtlı 4 firma -->
      <BarChart title="Saha Mühendisliği — En Çok Kayıtlı 4 Firma" :data="fieldEngineeringStats" color="#0f172a" />
    </div>

    <!-- Orta: büyük arama çubuğu + Petlas Gündem -->
    <div class="grid md:grid-cols-3 gap-5 mb-6">
      <div class="md:col-span-2">
        <div class="bg-white rounded-lg shadow-lg border-t-4 border-petlas-red p-8">
          <h1 class="text-2xl font-bold text-petlas-navy mb-4 text-center">Hızlı Arama</h1>
          <input v-model="q" @input="onQInput" type="text" placeholder="Plaka, firma, model, açıklama... herhangi bir şey yazın"
            class="w-full border-2 border-petlas-red rounded-lg px-4 py-4 text-lg text-center bg-red-50 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-petlas-red focus:bg-white transition-colors" />
        </div>

        <p v-if="loading" class="text-slate-500 mt-4">Aranıyor...</p>

        <template v-if="aramaYapildi && !loading">
          <div v-if="auth.can('VIEW_DOCUMENTS')" class="mt-4">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2">Dokümanlar</h2>
            <p v-if="docResults.length === 0" class="text-slate-400 text-sm mb-4">Sonuç bulunamadı.</p>
            <div class="space-y-2 mb-4">
              <router-link v-for="doc in docResults" :key="'doc-'+doc.id" :to="`/dokuman/${doc.id}`"
                class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-red">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h3 class="font-semibold text-petlas-navy">{{ doc.title }}</h3>
                  <span class="text-xs bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ doc.category || 'Genel' }}</span>
                </div>
                <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ doc.content }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="auth.can('VIEW_TIRE_TESTS')">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2">Saha Mühendisliği Kayıtları</h2>
            <p v-if="tireResults.length === 0" class="text-slate-400 text-sm mb-4">Sonuç bulunamadı.</p>
            <div class="space-y-2 mb-4">
              <router-link v-for="t in tireResults" :key="'tt-'+t.id" :to="`/lastik-testleri/${t.id}`"
                class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-petlas-navy">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h3 class="font-semibold text-petlas-navy">{{ t.plaka || t.aciklama }}</h3>
                  <span v-if="t.durum === 'SONLANDIRILDI'" class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">Sonlandırıldı</span>
                </div>
                <p class="text-sm text-slate-500 mt-1">
                  <span v-if="t.sirket">{{ t.sirket }} · </span>
                  <span v-if="t.model">{{ t.model }} · </span>
                  <span v-if="t.aciklama">{{ t.aciklama }}</span>
                </p>
              </router-link>
            </div>
          </div>
        </template>
      </div>

      <!-- Petlas Gündem -->
      <div>
        <router-link to="/gundem" class="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow h-full">
          <div class="bg-petlas-navy px-5 py-3">
            <h2 class="text-white text-base font-bold">Petlas Gündem</h2>
          </div>
          <div v-if="sonHaber" class="p-5">
            <img v-if="sonHaber.gorsel_url" :src="sonHaber.gorsel_url" class="w-full h-40 object-cover rounded mb-3" />
            <p class="font-semibold text-petlas-navy text-base mb-1">{{ sonHaber.baslik }}</p>
            <p class="text-sm text-slate-500 line-clamp-3">{{ sonHaber.icerik }}</p>
          </div>
          <p v-else class="p-5 text-sm text-slate-400">Henüz haber yayınlanmadı.</p>
        </router-link>
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
const loading = ref(false)
const aramaYapildi = ref(false)

const docResults = ref([])
const tireResults = ref([])

const sayaclar = ref({})
const fieldEngineeringStats = ref([])
const sonHaber = ref(null)

let debounceTimer = null
function onQInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doSearch, 300)
}

async function doSearch() {
  if (!q.value.trim()) {
    aramaYapildi.value = false
    docResults.value = []
    tireResults.value = []
    return
  }
  loading.value = true
  aramaYapildi.value = true
  try {
    const jobs = []
    if (auth.can('VIEW_DOCUMENTS')) {
      jobs.push(
        api.get('/documents/search', { params: { q: q.value } })
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
    await Promise.all(jobs)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await api.get('/stats/overview')
    sayaclar.value = res.data.anasayfaSayaclari || {}
    fieldEngineeringStats.value = res.data.fieldEngineeringStats.map(r => ({ label: r.label, count: r.count }))
  } catch { /* istatistik yüklenemezse sayfanın kalanı etkilenmesin */ }
}

async function loadSonHaber() {
  try {
    const res = await api.get('/haberler', { params: { limit: 1 } })
    sonHaber.value = res.data[0] || null
  } catch { /* haber yüklenemezse sayfanın kalanı etkilenmesin */ }
}

onMounted(() => {
  loadStats()
  loadSonHaber()
})
</script>

<style scoped>
.spin-slow {
  animation: spin 6s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
