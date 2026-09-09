<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Karışımlar</h1>
    <p class="text-slate-500 text-sm mb-6">Lastik Test Formu'nda seçilebilen karışım kataloğu. Her karışımın tüm teknik detayları buradaki açıklama alanında tutulur; formda sadece adı görünür.</p>

    <div v-if="canManage" class="bg-white rounded-lg shadow p-5 mb-6">
      <h2 class="font-semibold text-petlas-navy mb-3">{{ editingId ? 'Karışımı Düzenle' : 'Yeni Karışım Ekle' }}</h2>
      <form @submit.prevent="submitForm" class="space-y-3">
        <input v-model="form.ad" placeholder="Karışım adı (örn: TEXTILE CHAFER VAR)" required class="w-full border border-slate-300 rounded px-3 py-2" />
        <textarea v-model="form.aciklama" placeholder="Detaylar / özelleştirme (opsiyonel)" rows="4" class="w-full border border-slate-300 rounded px-3 py-2"></textarea>
        <div class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors">
            {{ editingId ? 'Güncelle' : 'Ekle' }}
          </button>
          <button v-if="editingId" type="button" @click="resetForm" class="text-slate-500 px-3 py-2">İptal</button>
        </div>
        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>
    <p v-else class="text-sm text-amber-600 mb-6">Karışım ekleme/düzenleme yetkiniz yok, sadece listeyi görüntüleyebilirsiniz.</p>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="text-left px-4 py-2">Ad</th>
            <th class="text-left px-4 py-2">Açıklama</th>
            <th v-if="canManage" class="text-left px-4 py-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in karisimlar" :key="k.id" class="border-t border-slate-200">
            <td class="px-4 py-2 font-medium text-petlas-navy">{{ k.ad }}</td>
            <td class="px-4 py-2 text-slate-500">{{ k.aciklama || '—' }}</td>
            <td v-if="canManage" class="px-4 py-2 space-x-2">
              <button @click="editKarisim(k)" class="text-petlas-blue hover:underline text-xs">Düzenle</button>
              <button @click="deleteKarisim(k.id)" class="text-petlas-red hover:underline text-xs">Sil</button>
            </td>
          </tr>
          <tr v-if="karisimlar.length === 0"><td :colspan="canManage ? 3 : 2" class="px-4 py-4 text-slate-400 text-center">Henüz karışım eklenmedi.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const canManage = computed(() => auth.canManageKarisim)

const karisimlar = ref([])
const editingId = ref(null)
const message = ref('')
const messageIsError = ref(false)
const form = reactive({ ad: '', aciklama: '' })

async function loadKarisimlar() {
  const res = await api.get('/karisimlar')
  karisimlar.value = res.data
}

function resetForm() {
  editingId.value = null
  form.ad = ''
  form.aciklama = ''
}

async function submitForm() {
  message.value = ''
  try {
    if (editingId.value) {
      await api.put(`/karisimlar/${editingId.value}`, form)
      message.value = 'Karışım güncellendi.'
    } else {
      await api.post('/karisimlar', form)
      message.value = 'Karışım eklendi.'
    }
    messageIsError.value = false
    resetForm()
    loadKarisimlar()
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

function editKarisim(k) {
  editingId.value = k.id
  form.ad = k.ad
  form.aciklama = k.aciklama || ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteKarisim(id) {
  if (!confirm('Bu karışımı silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/karisimlar/${id}`)
    loadKarisimlar()
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

onMounted(loadKarisimlar)
</script>
