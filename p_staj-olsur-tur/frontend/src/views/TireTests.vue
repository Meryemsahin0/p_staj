<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
      <h1 class="text-2xl font-bold text-petlas-navy">Lastik Test Formu</h1>
      <router-link v-if="auth.can('CREATE_TIRE_TESTS')" to="/lastik-testleri/yeni"
        class="bg-petlas-red hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        + Yeni Test Formu
      </router-link>
    </div>
    <p class="text-slate-500 text-sm mb-6">Sahada doldurulan lastik test formlarının dijital kaydı, her özelliğe göre filtreleme ve Excel'e aktarma. En son eklenen kayıtlar en üstte listelenir.</p>

    <!-- Filtre Paneli -->
    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Filtreler</h2>
        <button @click="clearFilters" class="text-xs text-slate-400 hover:text-petlas-red">Filtreleri Temizle</button>
      </div>
      <div class="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <input v-model="filters.q" @keyup.enter="doSearch" type="text" placeholder="Genel arama (formdaki herhangi bir bilgiyle arayın)"
          class="sm:col-span-2 lg:col-span-2 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petlas-red" />

        <div v-for="f in filterFields" :key="f.key">
          <input v-model="filters[f.key]" @input="onFilterInput(f.key, f.column)" @focus="onFilterFocus(f.key, f.column)" @keyup.enter="doSearch"
            :list="'dl-' + f.key" type="text" :placeholder="f.label"
            class="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petlas-red" />
          <datalist :id="'dl-' + f.key">
            <option v-for="v in suggestions[f.key]" :key="v" :value="v" />
          </datalist>
        </div>
      </div>
      <button @click="doSearch" class="mt-3 bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded text-sm transition-colors">Filtrele</button>
    </div>

    <!-- Sonuç özeti + Excel'e Aktar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <p class="text-sm text-slate-500">
        {{ results.length }} kayıt bulundu
        <span v-if="selectedIds.length > 0"> · {{ selectedIds.length }} kayıt seçili</span>
      </p>
      <button @click="exportToExcel" :disabled="results.length === 0"
        class="bg-green-700 hover:bg-green-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        📊 Excel'e Aktar {{ selectedIds.length > 0 ? `(${selectedIds.length} seçili)` : '(tümü)' }}
      </button>
    </div>

    <p v-if="loading" class="text-slate-500">Aranıyor...</p>
    <p v-else-if="results.length === 0" class="text-slate-500">Sonuç bulunamadı.</p>

    <!-- Filtrelenmiş sonuç tablosu (seçim yapılabilir) -->
    <div v-else class="bg-white rounded-lg shadow overflow-x-auto mb-6">
      <table class="w-full text-xs">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="px-3 py-2"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll" /></th>
            <th class="text-left px-3 py-2">Plaka</th>
            <th class="text-left px-3 py-2">Firma</th>
            <th class="text-left px-3 py-2">Açıklama</th>
            <th class="text-left px-3 py-2">Araç Cinsi</th>
            <th class="text-left px-3 py-2">Araç Tipi</th>
            <th class="text-left px-3 py-2">Araç No</th>
            <th class="text-left px-3 py-2">Model</th>
            <th class="text-left px-3 py-2">Test No</th>
            <th class="text-left px-3 py-2">Hafta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in results" :key="t.id" class="border-t border-slate-200 hover:bg-slate-50">
            <td class="px-3 py-2"><input type="checkbox" :value="t.id" v-model="selectedIds" /></td>
            <td class="px-3 py-2"><router-link :to="`/lastik-testleri/${t.id}`" class="text-petlas-blue hover:underline font-medium">{{ t.plaka || '—' }}</router-link></td>
            <td class="px-3 py-2">{{ t.sirket || '—' }}</td>
            <td class="px-3 py-2">{{ t.aciklama }}</td>
            <td class="px-3 py-2">{{ t.arac_cinsi || '—' }}</td>
            <td class="px-3 py-2">{{ t.arac_tipi || '—' }}</td>
            <td class="px-3 py-2">{{ t.arac_no || '—' }}</td>
            <td class="px-3 py-2">{{ t.model || '—' }}</td>
            <td class="px-3 py-2">{{ t.test_no || '—' }}</td>
            <td class="px-3 py-2">{{ t.hafta || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const results = ref([])
const loading = ref(false)
const selectedIds = ref([])

// Genel arama (q) hariç, veritabanı sütun adlarıyla eşleşen ve otomatik tamamlama
// (yazarken öneri) desteği olan filtre alanları.
// NOT: "seriNo" özel bir alandır — düz bir sütun değil, pozisyon bazlı "items" içindeki
// seri numaralarında arar (backend'de column='seri_no' özel durumu ile eşleşir).
const filterFields = [
  { key: 'sirket', column: 'sirket', label: 'Firma / Şirket' },
  { key: 'aracCinsi', column: 'arac_cinsi', label: 'Araç Cinsi' },
  { key: 'aracTipi', column: 'arac_tipi', label: 'Araç Tipi' },
  { key: 'plaka', column: 'plaka', label: 'Plaka' },
  { key: 'aracNo', column: 'arac_no', label: 'Araç No' },
  { key: 'model', column: 'model', label: 'Model' },
  { key: 'testNo', column: 'test_no', label: 'Test No' },
  { key: 'seriNo', column: 'seri_no', label: 'Seri Numarası' },
  { key: 'karisim', column: 'karisim', label: 'Karışım' },
  { key: 'hafta', column: 'hafta', label: 'Hafta' }
]

const filters = reactive(Object.fromEntries([['q', ''], ...filterFields.map(f => [f.key, ''])]))
const suggestions = reactive(Object.fromEntries(filterFields.map(f => [f.key, []])))

let debounceTimer = null
// Kullanıcı bir filtre kutusuna yazmaya başladığında, o alanda o metinle BAŞLAYAN
// mevcut değerleri (en son kullanılana göre sıralı) öneri olarak getirir.
function onFilterInput(key, column) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await fetchSuggestions(key, column, filters[key])
  }, 200)
}

// Kutu boşken bile tıklanır tıklanmaz (hiçbir şey yazmadan) o alanda daha önce
// girilmiş tüm değerleri gösterir — tüm filtreler için aynı davranış.
function onFilterFocus(key, column) {
  if (!filters[key]) fetchSuggestions(key, column, '')
}

async function fetchSuggestions(key, column, value) {
  try {
    const res = await api.get('/tire-tests/distinct-values', { params: { field: column, q: value } })
    suggestions[key] = res.data
  } catch { /* öneri yüklenemezse filtreleme yine çalışsın */ }
}

const allSelected = computed(() => results.value.length > 0 && selectedIds.value.length === results.value.length)

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked ? results.value.map(t => t.id) : []
}

function clearFilters() {
  Object.keys(filters).forEach(k => { filters[k] = '' })
  doSearch()
}

async function doSearch() {
  loading.value = true
  try {
    // Backend zaten en son eklenen kaydı en üstte döndürür (created_at DESC),
    // bu yüzden filtresiz durumda da liste her zaman en yeniden en eskiye sıralıdır.
    const res = await api.get('/tire-tests/search', { params: { ...filters } })
    results.value = res.data
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

// Seçili kayıt varsa sadece onları, yoksa filtrelenmiş tüm sonuçları Excel'e aktarır.
function exportToExcel() {
  const rows = selectedIds.value.length > 0
    ? results.value.filter(t => selectedIds.value.includes(t.id))
    : results.value

  const excelData = rows.map(t => ({
    'Açıklama': t.aciklama || '',
    'Firma': t.sirket || '',
    'Araç Cinsi': t.arac_cinsi || '',
    'Araç Tipi': t.arac_tipi || '',
    'Plaka': t.plaka || '',
    'Araç No': t.arac_no || '',
    'Model': t.model || '',
    'Test No': t.test_no || '',
    'Hafta': t.hafta || '',
    'Oluşturulma Tarihi': t.created_at ? new Date(t.created_at).toLocaleString('tr-TR') : ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(excelData)
  worksheet['!cols'] = Object.keys(excelData[0] || {}).map(() => ({ wch: 18 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lastik Testleri')

  const tarih = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `lastik-testleri-${tarih}.xlsx`)
}

onMounted(doSearch)
</script>
