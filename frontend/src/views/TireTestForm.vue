<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <router-link to="/lastik-testleri" class="text-sm text-petlas-blue hover:underline">&larr; Listeye dön</router-link>

    <div class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-4">
        <h1 class="text-white text-xl font-bold">{{ isNew ? 'Yeni Lastik Test Formu' : (canEdit ? 'Formu Düzenle' : 'Test Formu Detayı') }}</h1>
      </div>

      <form @submit.prevent="submitForm" class="p-6 space-y-6">
        <!-- Üst Bilgiler -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Genel Bilgiler</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1">Açıklama *</label>
              <input v-model="form.aciklama" :disabled="!canEdit" required placeholder="Örn: 35 Ton Yarı Römork Sahra Testi"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Şirket</label>
              <input v-model="form.sirket" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç Cinsi</label>
              <select v-model="form.aracCinsi" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100">
                <option value="">Seçin</option>
                <option v-for="opt in aracCinsiOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Plaka</label>
              <input v-model="form.plaka" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç No</label>
              <input v-model="form.aracNo" :disabled="!canEdit" placeholder="Örn: ARC-0451" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Marka - Model</label>
              <input v-model="form.model" :disabled="!canEdit" placeholder="Örn: Mercedes-Benz - Actros" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç Tipi</label>
              <input v-model="form.aracTipi" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Test No</label>
              <input v-model="form.testNo" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Hafta</label>
              <input v-model="form.hafta" :disabled="!canEdit" placeholder="Örn: 2026-W27" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Yük Ağırlığı</label>
              <input v-model="form.yukAgirligi" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
          </div>
        </section>

        <!-- Montaj Pozisyonu (Araç cinsine göre tıklanabilir diyagram) -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Montaj Pozisyonu</h2>
          <p v-if="!form.aracCinsi" class="text-xs text-amber-600 mb-2">Araç cinsi seçilmedi — tüm pozisyon kodları gösteriliyor. Araç cinsi seçtiğinizde sadece o araca uygun pozisyonlar listelenir.</p>
          <p class="text-xs text-slate-500 mb-2">Bir pozisyona tıklamak, aşağıdaki tabloya o pozisyon için otomatik bir satır ekler/kaldırır.</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-slate-500 mb-1">SOL</p>
              <div class="flex flex-wrap gap-2">
                <label v-for="kod in solKodlar" :key="kod"
                  class="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer"
                  :class="isSecili(kod) ? 'bg-petlas-navy text-white border-petlas-navy' : 'border-slate-300'">
                  <input type="checkbox" class="hidden" :disabled="!canEdit" :checked="isSecili(kod)" @change="toggleKod(kod)" />
                  {{ kod }}
                </label>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 mb-1">SAĞ</p>
              <div class="flex flex-wrap gap-2">
                <label v-for="kod in sagKodlar" :key="kod"
                  class="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer"
                  :class="isSecili(kod) ? 'bg-petlas-navy text-white border-petlas-navy' : 'border-slate-300'">
                  <input type="checkbox" class="hidden" :disabled="!canEdit" :checked="isSecili(kod)" @change="toggleKod(kod)" />
                  {{ kod }}
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Ebat / Desen / Hatta Kodu / Seri Numarası (pozisyon bazlı, benzersiz Lastik ID ile) -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Lastik Bilgileri (Pozisyon Bazlı)</h2>
            <button v-if="canEdit" type="button" @click="addManualItem" class="text-xs text-petlas-blue hover:underline">+ Ekstra Satır (manuel)</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-slate-500 border-b">
                  <th class="py-1 pr-2">Pozisyon</th>
                  <th class="py-1 pr-2">Lastik ID</th>
                  <th class="py-1 pr-2">Ebat</th>
                  <th class="py-1 pr-2">Desen</th>
                  <th class="py-1 pr-2">Hatta Kodu</th>
                  <th class="py-1 pr-2">Seri Numarası</th>
                  <th v-if="canEdit"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in form.items" :key="i" class="border-b border-slate-100">
                  <td class="py-1 pr-2"><input v-model="item.pozisyon" :disabled="!canEdit" placeholder="S1" class="w-14 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.lastik_id" :disabled="!canEdit" class="w-36 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100 font-mono text-[11px]" /></td>
                  <td class="py-1 pr-2"><input v-model="item.ebat" :disabled="!canEdit" placeholder="385/65 R22.5" class="w-28 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.desen" :disabled="!canEdit" placeholder="NH200" class="w-20 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.hatta_kodu" :disabled="!canEdit" class="w-20 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.seri_numarasi" :disabled="!canEdit" class="w-28 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td v-if="canEdit" class="py-1"><button type="button" @click="removeItem(i)" class="text-petlas-red text-xs">Sil</button></td>
                </tr>
                <tr v-if="form.items.length === 0"><td colspan="7" class="text-slate-400 py-2">Yukarıdan pozisyon seçerek satır ekleyin.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Tarihe göre PSI ölçümleri -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Tarihe Göre Ölçümler</h2>
            <button v-if="canEdit" type="button" @click="addMeasurement" class="text-xs text-petlas-blue hover:underline">+ Tarih Ekle</button>
          </div>
          <div v-for="(m, i) in form.measurements" :key="i" class="border border-slate-200 rounded p-3 mb-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold text-slate-500">{{ i + 1 }}. Tarih</p>
              <button v-if="canEdit" type="button" @click="form.measurements.splice(i,1)" class="text-petlas-red text-xs">Sil</button>
            </div>
            <div class="grid sm:grid-cols-4 gap-2 mb-2">
              <div><label class="block text-xs text-slate-500 mb-0.5">Tarih</label><input v-model="m.tarih" :disabled="!canEdit" type="date" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">KM</label><input v-model="m.km" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Desen</label><input v-model="m.desen" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Orj. Diş Derinliği</label><input v-model="m.orj_dis_derinligi" :disabled="!canEdit" placeholder="örn: 15 mm" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
            </div>
            <div class="grid sm:grid-cols-4 gap-2 mb-2">
              <div v-for="j in 4" :key="j">
                <label class="block text-xs text-slate-500 mb-0.5">Ölçülen PSI {{ j }}</label>
                <input v-model="m.olculen_psi[j-1]" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
              </div>
            </div>
            <div class="grid sm:grid-cols-5 gap-2">
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (F)</label><input v-model="m.onerilen_psi.f" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (D)</label><input v-model="m.onerilen_psi.d" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (T)</label><input v-model="m.onerilen_psi.t" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Sıcak</label><input v-model="m.sicak" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Soğuk</label><input v-model="m.soguk" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
            </div>
          </div>
          <p v-if="form.measurements.length === 0" class="text-slate-400 text-xs">Henüz ölçüm eklenmedi.</p>
        </section>

        <!-- AI Yorumu -->
        <section v-if="form.measurements.length > 0">
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">🤖 AI Yorumu</h2>
          <div class="bg-blue-50 border-l-4 border-petlas-blue rounded p-3">
            <p class="text-sm text-slate-700 whitespace-pre-line">{{ aiYorumu }}</p>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Bu yorum, girilen ölçüm verilerine göre otomatik (kural tabanlı) oluşturulur; stajyer ve ekip için hızlı bir özet sağlar, teknik onayın yerine geçmez.</p>
        </section>

        <!-- Tablolaştır / Excel indir -->
        <section>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" @click="showTable = !showTable" class="bg-petlas-navy hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded transition-colors">
              {{ showTable ? 'Tabloyu Gizle' : '📊 Tablolaştır' }}
            </button>
            <button v-if="showTable" type="button" @click="downloadExcel" class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded transition-colors">
              ⬇ Excel Olarak İndir
            </button>
          </div>

          <div v-if="showTable" class="mt-3 space-y-4">
            <div class="overflow-x-auto">
              <p class="text-xs font-semibold text-slate-500 mb-1">Lastikler</p>
              <table class="w-full text-xs border border-slate-200">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left px-2 py-1 border-b">Pozisyon</th>
                    <th class="text-left px-2 py-1 border-b">Lastik ID</th>
                    <th class="text-left px-2 py-1 border-b">Ebat</th>
                    <th class="text-left px-2 py-1 border-b">Desen</th>
                    <th class="text-left px-2 py-1 border-b">Hatta Kodu</th>
                    <th class="text-left px-2 py-1 border-b">Seri No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in form.items" :key="i" class="border-b border-slate-100">
                    <td class="px-2 py-1">{{ item.pozisyon }}</td>
                    <td class="px-2 py-1 font-mono">{{ item.lastik_id }}</td>
                    <td class="px-2 py-1">{{ item.ebat }}</td>
                    <td class="px-2 py-1">{{ item.desen }}</td>
                    <td class="px-2 py-1">{{ item.hatta_kodu }}</td>
                    <td class="px-2 py-1">{{ item.seri_numarasi }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="overflow-x-auto">
              <p class="text-xs font-semibold text-slate-500 mb-1">Ölçümler</p>
              <table class="w-full text-xs border border-slate-200">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left px-2 py-1 border-b">Tarih</th>
                    <th class="text-left px-2 py-1 border-b">KM</th>
                    <th class="text-left px-2 py-1 border-b">Diş Derinliği</th>
                    <th class="text-left px-2 py-1 border-b">PSI 1-4</th>
                    <th class="text-left px-2 py-1 border-b">Önerilen F/D/T</th>
                    <th class="text-left px-2 py-1 border-b">Sıcak/Soğuk</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in form.measurements" :key="i" class="border-b border-slate-100">
                    <td class="px-2 py-1">{{ m.tarih }}</td>
                    <td class="px-2 py-1">{{ m.km }}</td>
                    <td class="px-2 py-1">{{ m.orj_dis_derinligi }}</td>
                    <td class="px-2 py-1">{{ m.olculen_psi.join(' / ') }}</td>
                    <td class="px-2 py-1">{{ m.onerilen_psi.f }} / {{ m.onerilen_psi.d }} / {{ m.onerilen_psi.t }}</td>
                    <td class="px-2 py-1">{{ m.sicak }} / {{ m.soguk }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Ek dosya ve notlar -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Ek Dosya ve Notlar</h2>
          <div v-if="canEdit" class="mb-3">
            <label class="block text-xs font-medium text-slate-600 mb-1">Kağıt Formun Fotoğrafı / PDF (opsiyonel)</label>
            <input type="file" accept=".pdf,image/*" @change="onFileSelected"
              class="w-full text-sm border border-slate-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-petlas-navy file:text-white file:text-xs" />
            <p v-if="uploading" class="text-xs text-slate-500 mt-1">Yükleniyor...</p>
          </div>
          <a v-if="form.filePath" :href="form.filePath" target="_blank" class="inline-block text-sm text-petlas-blue hover:underline mb-3">📎 Ek dosyayı görüntüle</a>
          <textarea v-model="form.notlar" :disabled="!canEdit" rows="3" placeholder="Notlar"
            class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100"></textarea>
        </section>

        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>

        <div v-if="canEdit" class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-6 py-2 rounded transition-colors">
            {{ isNew ? 'Formu Kaydet' : 'Güncelle' }}
          </button>
          <button v-if="!isNew" type="button" @click="deleteForm" class="text-petlas-red text-sm px-3 py-2">Sil</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isNew = computed(() => route.name === 'tire-test-new')
const canEdit = computed(() => auth.canEditContent)
const uploading = ref(false)
const message = ref('')
const messageIsError = ref(false)
const showTable = ref(false)

const aracCinsiOptions = [
  'C - BİJLİ', 'TR - TRAKTÖR ÜNİTE', 'R - TREYLER', 'S - YARI TREYLER',
  'T - YARI MESAFE', 'İ - ŞEHİRLER ARASI OTOBÜS', 'U - ŞEHİR OTOBÜSÜ', 'F - FİLO OTOBÜSÜ'
]

// Araç cinsine göre uygun lastik pozisyon kodları (S1-S9 Sol / D1-D9 Sağ)
const positionsByType = {
  'C - BİJLİ': ['S1', 'S2', 'D1', 'D2'],
  'TR - TRAKTÖR ÜNİTE': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3'],
  'R - TREYLER': ['S1', 'S2', 'S3', 'S4', 'D1', 'D2', 'D3', 'D4'],
  'S - YARI TREYLER': ['S1', 'S2', 'S3', 'S4', 'S5', 'D1', 'D2', 'D3', 'D4', 'D5'],
  'T - YARI MESAFE': ['S1', 'S2', 'S3', 'S4', 'D1', 'D2', 'D3', 'D4'],
  'İ - ŞEHİRLER ARASI OTOBÜS': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3'],
  'U - ŞEHİR OTOBÜSÜ': ['S1', 'S2', 'D1', 'D2'],
  'F - FİLO OTOBÜSÜ': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3']
}
const tumKodlar = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','D1','D2','D3','D4','D5','D6','D7','D8','D9']

const form = reactive({
  aciklama: '', sirket: '', aracCinsi: '', plaka: '', aracNo: '', model: '', aracTipi: '', testNo: '',
  hafta: '', yukAgirligi: '', montajPozisyonu: [], items: [], measurements: [], filePath: '', notlar: ''
})

const solKodlar = computed(() => {
  const pool = form.aracCinsi && positionsByType[form.aracCinsi] ? positionsByType[form.aracCinsi] : tumKodlar
  return pool.filter(k => k.startsWith('S'))
})
const sagKodlar = computed(() => {
  const pool = form.aracCinsi && positionsByType[form.aracCinsi] ? positionsByType[form.aracCinsi] : tumKodlar
  return pool.filter(k => k.startsWith('D'))
})

function isSecili(kod) {
  return form.montajPozisyonu.some(p => p.kod === kod && p.secili)
}

function generateLastikId(kod) {
  const base = (form.testNo || `T${Date.now()}`).replace(/\s+/g, '')
  return `LST-${base}-${kod}`
}

// Pozisyona tıklamak artık otomatik olarak Lastik Bilgileri tablosuna satır ekler/kaldırır.
function toggleKod(kod) {
  if (!canEdit.value) return
  const existing = form.montajPozisyonu.find(p => p.kod === kod)
  const yeniSecili = !(existing && existing.secili)
  if (existing) existing.secili = yeniSecili
  else form.montajPozisyonu.push({ kod, secili: true })

  if (yeniSecili) {
    if (!form.items.some(i => i.pozisyon === kod)) {
      form.items.push({ pozisyon: kod, lastik_id: generateLastikId(kod), ebat: '', desen: '', hatta_kodu: '', seri_numarasi: '' })
    }
  } else {
    const idx = form.items.findIndex(i => i.pozisyon === kod)
    if (idx !== -1) {
      const item = form.items[idx]
      if (item.ebat || item.seri_numarasi || item.desen) {
        if (!confirm(`${kod} pozisyonundaki satırda veri var, yine de kaldırılsın mı?`)) {
          const p = form.montajPozisyonu.find(x => x.kod === kod)
          if (p) p.secili = true
          return
        }
      }
      form.items.splice(idx, 1)
    }
  }
}

function addManualItem() {
  form.items.push({ pozisyon: '', lastik_id: generateLastikId('X'), ebat: '', desen: '', hatta_kodu: '', seri_numarasi: '' })
}
function removeItem(i) {
  const item = form.items[i]
  const p = form.montajPozisyonu.find(x => x.kod === item.pozisyon)
  if (p) p.secili = false
  form.items.splice(i, 1)
}

function addMeasurement() {
  form.measurements.push({
    tarih: '', km: '', desen: '', orj_dis_derinligi: '',
    olculen_psi: ['', '', '', ''], onerilen_psi: { f: '', d: '', t: '' }, sicak: '', soguk: ''
  })
}

// --- AI Yorumu (kural tabanlı, yapay zeka API'si gerektirmez) ---
function parseNum(val) {
  if (!val) return null
  const m = String(val).replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}
const aiYorumu = computed(() => {
  const olculumler = form.measurements.filter(m => m.tarih)
  if (olculumler.length === 0) return 'Henüz tarih girilmiş bir ölçüm bulunmuyor.'

  const siraliOlcumler = [...olculumler].sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
  const ilk = siraliOlcumler[0]
  const son = siraliOlcumler[siraliOlcumler.length - 1]

  const cumleler = []
  cumleler.push(`Toplam ${siraliOlcumler.length} ölçüm kaydı bulunuyor (${ilk.tarih} → ${son.tarih}).`)

  const kmIlk = parseNum(ilk.km)
  const kmSon = parseNum(son.km)
  let kmFarki = null
  if (kmIlk !== null && kmSon !== null) {
    kmFarki = kmSon - kmIlk
    cumleler.push(`Bu süreçte araç yaklaşık ${kmFarki.toLocaleString('tr-TR')} km yol yapmış.`)
  }

  const disIlk = parseNum(ilk.orj_dis_derinligi)
  const disSon = parseNum(son.orj_dis_derinligi)
  if (disIlk !== null && disSon !== null) {
    const fark = disIlk - disSon
    if (fark > 0) {
      cumleler.push(`Diş derinliği ${disIlk} mm'den ${disSon} mm'ye düşmüş (${fark.toFixed(1)} mm aşınma).`)
      if (kmFarki && kmFarki > 0) {
        const oran = (fark / kmFarki) * 1000
        const durum = oran > 0.7 ? 'HIZLI aşınma (kontrol önerilir)' : oran > 0.4 ? 'normal aşınma aralığında' : 'düşük/yavaş aşınma'
        cumleler.push(`Yaklaşık ${oran.toFixed(2)} mm/1000km aşınma oranı — bu ${durum}.`)
      }
      if (disSon <= 3) {
        cumleler.push('⚠️ Diş derinliği kritik seviyeye (≤3mm) yaklaşmış/ulaşmış, lastik değişimi değerlendirilmeli.')
      }
    } else if (fark < 0) {
      cumleler.push('Diş derinliği ölçümünde artış görünüyor, veri girişini kontrol edin.')
    } else {
      cumleler.push('Diş derinliğinde ilk ve son ölçüm arasında fark görünmüyor.')
    }
  }

  const sonPsiler = (son.olculen_psi || []).map(parseNum).filter(v => v !== null)
  if (sonPsiler.length > 0) {
    const ortalama = sonPsiler.reduce((a, b) => a + b, 0) / sonPsiler.length
    const onerilenF = parseNum(son.onerilen_psi?.f)
    cumleler.push(`Son ölçümde ortalama PSI: ${ortalama.toFixed(1)}.`)
    if (onerilenF !== null) {
      const fark = ortalama - onerilenF
      if (Math.abs(fark) > 5) {
        cumleler.push(`Önerilen PSİ değerinden (${onerilenF}) ${Math.abs(fark).toFixed(1)} birim ${fark > 0 ? 'yüksek' : 'düşük'} — basınç ayarı kontrol edilmeli.`)
      } else {
        cumleler.push('Ölçülen basınç, önerilen değere yakın seyrediyor.')
      }
    }
  }

  return cumleler.join(' ')
})

// --- Excel export ---
function downloadExcel() {
  const wb = XLSX.utils.book_new()
  const itemsSheet = XLSX.utils.json_to_sheet(form.items.map(i => ({
    Pozisyon: i.pozisyon, 'Lastik ID': i.lastik_id, Ebat: i.ebat, Desen: i.desen,
    'Hatta Kodu': i.hatta_kodu, 'Seri No': i.seri_numarasi
  })))
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Lastikler')

  const measurementsSheet = XLSX.utils.json_to_sheet(form.measurements.map(m => ({
    Tarih: m.tarih, KM: m.km, Desen: m.desen, 'Diş Derinliği': m.orj_dis_derinligi,
    'PSI 1': m.olculen_psi[0], 'PSI 2': m.olculen_psi[1], 'PSI 3': m.olculen_psi[2], 'PSI 4': m.olculen_psi[3],
    'Önerilen F': m.onerilen_psi.f, 'Önerilen D': m.onerilen_psi.d, 'Önerilen T': m.onerilen_psi.t,
    Sıcak: m.sicak, Soğuk: m.soguk
  })))
  XLSX.utils.book_append_sheet(wb, measurementsSheet, 'Ölçümler')

  const dosyaAdi = (form.aciklama || 'lastik-test-formu').replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ\- ]/g, '').slice(0, 60)
  XLSX.writeFile(wb, `${dosyaAdi}.xlsx`)
}

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    form.filePath = res.data.url
  } catch (err) {
    message.value = err.response?.data?.error || 'Dosya yüklenemedi.'
    messageIsError.value = true
  } finally {
    uploading.value = false
  }
}

async function loadExisting() {
  const res = await api.get(`/tire-tests/${route.params.id}`)
  const d = res.data
  form.aciklama = d.aciklama
  form.sirket = d.sirket
  form.aracCinsi = d.arac_cinsi
  form.plaka = d.plaka
  form.aracNo = d.arac_no
  form.model = d.model
  form.aracTipi = d.arac_tipi
  form.testNo = d.test_no
  form.hafta = d.hafta
  form.yukAgirligi = d.yuk_agirligi
  form.montajPozisyonu = d.montaj_pozisyonu || []
  form.items = d.items || []
  form.measurements = (d.measurements || []).map(m => ({
    ...m,
    olculen_psi: m.olculen_psi || ['', '', '', ''],
    onerilen_psi: m.onerilen_psi || { f: '', d: '', t: '' }
  }))
  form.filePath = d.file_path || ''
  form.notlar = d.notlar || ''
}

async function submitForm() {
  message.value = ''
  try {
    if (isNew.value) {
      const res = await api.post('/tire-tests', form)
      message.value = 'Test formu kaydedildi.'
      messageIsError.value = false
      router.push(`/lastik-testleri/${res.data.id}`)
    } else {
      await api.put(`/tire-tests/${route.params.id}`, form)
      message.value = 'Test formu güncellendi.'
      messageIsError.value = false
    }
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

async function deleteForm() {
  if (!confirm('Bu test formunu silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/tire-tests/${route.params.id}`)
    router.push('/lastik-testleri')
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

onMounted(() => {
  if (!isNew.value) loadExisting()
})
</script>
