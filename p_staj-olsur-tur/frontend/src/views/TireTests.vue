<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
      <h1 class="text-2xl font-bold text-petlas-navy">Lastik Test Formu</h1>
      <router-link v-if="auth.can('CREATE_TIRE_TESTS')" to="/lastik-testleri/yeni"
        class="bg-petlas-red hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        + Yeni Test Formu
      </router-link>
    </div>

    <!-- Genel arama: lastikle ilgili herhangi bir bilgi (seri no, ebat, desen, özellik, plaka, firma...) -->
    <div class="flex gap-2 mb-4">
      <input v-model="genelArama" @keyup.enter="doSearch" type="text"
        placeholder="Herhangi bir şey arayın: plaka, firma, seri numarası, ebat, desen, özellik..."
        class="flex-1 border border-slate-300 rounded px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-petlas-red" />
      <button @click="doSearch" class="bg-petlas-navy hover:bg-slate-800 text-white font-semibold px-6 rounded transition-colors">
        Ara
      </button>
    </div>

    <!-- Sonuç özeti + Filtrele + Excel'e Aktar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <div class="flex items-center gap-2">
        <button @click="doSearch" class="bg-petlas-navy hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
          Filtrele
        </button>
        <p class="text-sm text-slate-500">
          {{ results.length }} kayıt bulundu
          <span v-if="aktifFiltreSayisi > 0"> · {{ aktifFiltreSayisi }} filtre aktif</span>
          <button v-if="aktifFiltreSayisi > 0 || genelArama" @click="clearFilters" class="ml-2 text-petlas-red hover:underline">Temizle</button>
          <span v-if="selectedIds.length > 0"> · {{ selectedIds.length }} kayıt seçili</span>
        </p>
      </div>
      <button @click="exportToExcel" :disabled="results.length === 0"
        class="bg-green-700 hover:bg-green-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
        Excel'e Aktar {{ selectedIds.length > 0 ? `(${selectedIds.length} seçili)` : '(tümü)' }}
      </button>
    </div>

    <p v-if="loading" class="text-slate-500">Aranıyor...</p>
    <p v-else-if="results.length === 0" class="text-slate-500">Sonuç bulunamadı.</p>

    <div v-else class="bg-white rounded-lg shadow overflow-x-auto mb-6">
      <table class="w-full text-xs">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="px-3 py-2"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll" /></th>
            <th v-for="col in columns" :key="col.key" class="text-left px-3 py-2 align-top">
              <div class="flex items-center gap-1">
                <span>{{ col.label }}</span>
                <button v-if="col.column" @click="toggleFilterOpen(col.key)" class="opacity-70 hover:opacity-100"
                  :class="filters[col.key] ? 'text-amber-300' : ''" title="Bu sütuna göre filtrele">
                  <svg viewBox="0 0 20 20" class="w-3.5 h-3.5 fill-current"><path d="M8.5 3a5.5 5.5 0 104.23 9.02l4.13 4.12 1.06-1.06-4.12-4.13A5.5 5.5 0 008.5 3zm0 1.5a4 4 0 110 8 4 4 0 010-8z"/></svg>
                </button>
              </div>
              <div v-if="filterOpen[col.key]" class="mt-1">
                <select v-if="col.type === 'select'" v-model="filters[col.key]"
                  class="w-full text-slate-800 text-xs rounded px-1 py-1 font-normal">
                  <option value="">Tümü</option>
                  <option v-for="opt in col.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input v-else v-model="filters[col.key]" @input="onFilterInput(col.key, col.column)" @focus="onFilterFocus(col.key, col.column)"
                  @keyup.enter="doSearch" :list="'dl-' + col.key" type="text" placeholder="ara..."
                  class="w-full text-slate-800 text-xs rounded px-1 py-1 font-normal" />
                <datalist :id="'dl-' + col.key">
                  <option v-for="v in suggestions[col.key]" :key="v" :value="v" />
                </datalist>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in results" :key="t.id" class="border-t border-slate-200 hover:bg-slate-50">
            <td class="px-3 py-2"><input type="checkbox" :value="t.id" v-model="selectedIds" /></td>
            <td class="px-3 py-2"><router-link :to="`/lastik-testleri/${t.id}`" class="text-petlas-blue hover:underline font-medium">{{ t.plaka || '—' }}</router-link></td>
            <td class="px-3 py-2">
              <button v-if="t.sirket" @click="filtreleFirma(t.sirket)" class="text-petlas-blue hover:underline text-left">{{ t.sirket }}</button>
              <span v-else>—</span>
            </td>
            <td class="px-3 py-2">{{ t.arac_cinsi || '—' }}</td>
            <td class="px-3 py-2">{{ t.arac_tipi || '—' }}</td>
            <td class="px-3 py-2">{{ t.arac_no || '—' }}</td>
            <td class="px-3 py-2">{{ t.model || '—' }}</td>
            <td class="px-3 py-2">
              <template v-if="t.ozellik_listesi">
                <template v-for="(ad, i) in t.ozellik_listesi.split(', ')" :key="ad">
                  <button @click="filtreleOzellik(ad)" class="text-petlas-blue hover:underline">{{ ad }}</button><span v-if="i < t.ozellik_listesi.split(', ').length - 1">, </span>
                </template>
              </template>
              <span v-else>—</span>
            </td>
            <td class="px-3 py-2">{{ t.hafta || '—' }}</td>
            <td class="px-3 py-2">
              <span :class="t.durum === 'SONLANDIRILDI' ? 'text-slate-400' : 'text-green-700 font-medium'">
                {{ t.durum === 'SONLANDIRILDI' ? 'Sonlandırıldı' : 'Aktif' }}
              </span>
            </td>
            <td class="px-3 py-2">{{ sonOlcumNo(t) }}</td>
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
const genelArama = ref('')

// Sütun tanımları: "column" backend'deki filtre alanı adı, boşsa filtrelenemez (kendi tıklanabilir mantığı olan sütunlar hariç).
const columns = [
  { key: 'plaka', column: 'plaka', label: 'Plaka' },
  { key: 'sirket', column: 'sirket', label: 'Firma' },
  { key: 'aracCinsi', column: 'arac_cinsi', label: 'Araç Cinsi' },
  { key: 'aracTipi', column: 'arac_tipi', label: 'Araç Tipi' },
  { key: 'aracNo', column: 'arac_no', label: 'Araç No' },
  { key: 'model', column: 'model', label: 'Model' },
  { key: 'ozellik', column: 'karisim', searchParam: 'karisim', label: 'Özellik' },
  { key: 'hafta', column: 'hafta', label: 'Hafta' },
  { key: 'durum', column: 'durum', label: 'Durum', type: 'select', options: [{ value: 'AKTIF', label: 'Aktif' }, { value: 'SONLANDIRILDI', label: 'Sonlandırıldı' }] },
  { key: 'sonOlcum', column: null, label: 'Son Ölçüm' }
]
const filtrelenebilirSutunlar = columns.filter(c => c.column)

const filters = reactive(Object.fromEntries(filtrelenebilirSutunlar.map(c => [c.key, ''])))
const filterOpen = reactive(Object.fromEntries(filtrelenebilirSutunlar.map(c => [c.key, false])))
const suggestions = reactive(Object.fromEntries(filtrelenebilirSutunlar.map(c => [c.key, []])))

const aktifFiltreSayisi = computed(() => Object.values(filters).filter(v => v).length)

function toggleFilterOpen(key) {
  filterOpen[key] = !filterOpen[key]
}

let debounceTimer = null
function onFilterInput(key, column) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSuggestions(key, column, filters[key])
  }, 200)
}

function onFilterFocus(key, column) {
  if (!filters[key]) fetchSuggestions(key, column, '')
}

async function fetchSuggestions(key, column, value) {
  try {
    const res = await api.get('/tire-tests/distinct-values', { params: { field: column, q: value } })
    suggestions[key] = res.data
  } catch { /* öneri yüklenemezse filtreleme yine çalışsın */ }
}

// Bir firma adına tıklanınca, o firmadaki tüm araçları filtreler.
// Bir aracın en son (en yüksek "kaçıncı ölçüm" numaralı) ölçümünü bulur.
function sonOlcumNo(t) {
  const olcumler = t.measurements || []
  if (olcumler.length === 0) return '—'
  const enBuyuk = Math.max(...olcumler.map(m => m.sira || 0))
  return enBuyuk > 0 ? enBuyuk : '—'
}

function filtreleFirma(sirket) {
  clearFilters(false)
  filters.sirket = sirket
  filterOpen.sirket = true
  doSearch()
}

// Bir özelliğe tıklanınca, o özelliğin bulunduğu tüm araçları filtreler.
function filtreleOzellik(ad) {
  clearFilters(false)
  filters.ozellik = ad
  filterOpen.ozellik = true
  doSearch()
}

const allSelected = computed(() => results.value.length > 0 && selectedIds.value.length === results.value.length)

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked ? results.value.map(t => t.id) : []
}

function clearFilters(aramaSonrasi = true) {
  Object.keys(filters).forEach(k => { filters[k] = '' })
  Object.keys(filterOpen).forEach(k => { filterOpen[k] = false })
  genelArama.value = ''
  if (aramaSonrasi) doSearch()
}

async function doSearch() {
  loading.value = true
  try {
    const params = {}
    if (genelArama.value) params.q = genelArama.value
    filtrelenebilirSutunlar.forEach(c => { if (filters[c.key]) params[c.searchParam || c.key] = filters[c.key] })
    const res = await api.get('/tire-tests/search', { params })
    results.value = res.data
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

// --- Excel'e aktarma için yardımcı fonksiyonlar ---
function parseNum(val) {
  if (!val) return null
  const m = String(val).replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

// Tek bir lastiğin 4 diş derinliği okumasının ortalamasını döner.
function ortalamaDisTekLastik(disler) {
  const degerler = (disler || []).map(parseNum).filter(v => v !== null)
  if (degerler.length === 0) return ''
  return (degerler.reduce((a, b) => a + b, 0) / degerler.length).toFixed(1)
}

// Türkçe karakterleri doğru küçük harfe çevirir (JS'in standart toLowerCase()'i İ/I'yı yanlış çevirir).
function turkceKucukHarfClient(str) {
  return String(str)
    .replace(/İ/g, 'i').replace(/I/g, 'ı').replace(/Ş/g, 'ş').replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü').replace(/Ö/g, 'ö').replace(/Ç/g, 'ç')
    .toLowerCase()
}

// Bir aracın TÜM lastiklerini değil, genel arama kutusuna yazılan terimle EŞLEŞEN lastiklerini
// döner (örn. "RH100" aratıldığında o araçtaki sadece RH100 desenli lastik(ler) çıksın, diğerleri değil).
// Eşleşme, aracın başka bir alanından (firma, model vb.) geldiyse (yani hiçbir lastik terimle
// eşleşmiyorsa) tüm lastikler gösterilir — filtre yanlışlıkla her şeyi gizlemesin diye.
function ilgiliLastikler(t) {
  const tumLastikler = (t.items && t.items.length) ? t.items : [{}]
  const terim = genelArama.value.trim()
  if (!terim) return tumLastikler
  const terimKucuk = turkceKucukHarfClient(terim)
  const eslesenler = tumLastikler.filter(it =>
    [it.desen, it.ebat, it.seri_numarasi, it.hafta].some(alan => alan && turkceKucukHarfClient(alan).includes(terimKucuk))
  )
  return eslesenler.length > 0 ? eslesenler : tumLastikler
}

function exportToExcel() {
  const rows = selectedIds.value.length > 0
    ? results.value.filter(t => selectedIds.value.includes(t.id))
    : results.value

  const headers = [
    'Plaka', 'Firma', 'İl', 'İletişim Numarası', 'Araç Cinsi', 'Araç Tipi', 'Araç No', 'Model', 'Özellik', 'Hafta', 'Durum',
    'Pozisyon', 'Seri Numarası', 'Desen', 'Ebat', 'Hafta Kodu (Lastik)', 'Orijinal Diş Derinliği',
    'Kaçıncı Ölçüm', 'Ölçüm Tarihi', 'Diş 1', 'Diş 2', 'Diş 3', 'Diş 4', 'Diş Ortalaması', 'PSİ',
    'Notlar', 'Oluşturulma Tarihi'
  ]
  // Hangi sütunların araç/lastik bazında birleştirileceği (sıfır tabanlı sütun indeksleri)
  const aracSutunlari = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 26]
  const lastikSutunlari = [11, 12, 13, 14, 15, 16]

  const dataRows = []
  const merges = []

  rows.forEach(t => {
    let notlarMetni = ''
    try {
      const liste = JSON.parse(t.notlar)
      if (Array.isArray(liste)) notlarMetni = liste.filter(n => n.icerik).map(n => `${n.tarih || 'Tarihsiz'} - ${n.icerik}`).join('; ')
    } catch { /* eski/boş format olabilir */ }
    const olusturmaTarihi = t.created_at ? new Date(t.created_at).toLocaleString('tr-TR') : ''

    const aracBaslangic = dataRows.length
    const items = ilgiliLastikler(t) // sadece arama terimiyle eşleşen lastikler (varsa), yoksa hepsi

    items.forEach(it => {
      const lastikBaslangic = dataRows.length
      const ilgiliOlcumler = (t.measurements || []).filter(m => (m.lastikOlcumleri || []).some(lo => lo.pozisyon === it.pozisyon))
      const olcumSatirlari = ilgiliOlcumler.length ? ilgiliOlcumler : [null]

      olcumSatirlari.forEach(m => {
        const lo = m ? (m.lastikOlcumleri || []).find(x => x.pozisyon === it.pozisyon) : null
        const disler = lo?.olculen_dis_derinlikleri || []
        dataRows.push([
          t.plaka || '', t.sirket || '', t.il || '', t.iletisim_no || '', t.arac_cinsi || '', t.arac_tipi || '', t.arac_no || '', t.model || '',
          t.ozellik_listesi || '', t.hafta || '', t.durum === 'SONLANDIRILDI' ? 'Sonlandırıldı' : 'Aktif',
          it.pozisyon || '', it.seri_numarasi || '', it.desen || '', it.ebat || '', it.hafta || '', it.orjDisDerinligi || '',
          m ? (m.sira || '') : '', m ? (m.tarih || '') : '',
          disler[0] || '', disler[1] || '', disler[2] || '', disler[3] || '',
          ortalamaDisTekLastik(disler), lo?.olculen_psi || '',
          notlarMetni, olusturmaTarihi
        ])
      })

      const lastikBitis = dataRows.length - 1
      if (lastikBitis > lastikBaslangic) {
        lastikSutunlari.forEach(col => merges.push({ s: { r: lastikBaslangic + 1, c: col }, e: { r: lastikBitis + 1, c: col } }))
      }
    })

    const aracBitis = dataRows.length - 1
    if (aracBitis > aracBaslangic) {
      aracSutunlari.forEach(col => merges.push({ s: { r: aracBaslangic + 1, c: col }, e: { r: aracBitis + 1, c: col } }))
    }
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
  worksheet['!merges'] = merges
  worksheet['!cols'] = headers.map(() => ({ wch: 16 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lastik Testleri')

  const tarih = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `lastik-testleri-${tarih}.xlsx`)
}

onMounted(doSearch)
</script>
