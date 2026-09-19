<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-petlas-navy mb-1">Petlas Gündem Yönetimi</h1>
    <p class="text-slate-500 text-sm mb-6">Ana sayfada gösterilecek haberleri buradan ekleyip düzenleyebilirsiniz. Liste, en son eklenen haber en üstte olacak şekilde herkese açıktır.</p>

    <div class="bg-white rounded-lg shadow p-5 mb-8">
      <h2 class="font-semibold text-petlas-navy mb-3">{{ editingId ? 'Haberi Düzenle' : 'Yeni Haber Ekle' }}</h2>
      <form @submit.prevent="submitForm" class="space-y-3">
        <input v-model="form.baslik" placeholder="Haber başlığı" required class="w-full border border-slate-300 rounded px-3 py-2" />
        <textarea v-model="form.icerik" placeholder="Haber içeriği" rows="5" required class="w-full border border-slate-300 rounded px-3 py-2"></textarea>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Haber Görseli (opsiyonel)</label>
          <input type="file" accept="image/*" @change="onGorselSecildi" class="w-full text-sm border border-slate-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-petlas-navy file:text-white file:text-xs" />
          <img v-if="form.gorselUrl" :src="form.gorselUrl" class="mt-2 h-32 rounded border border-slate-200 object-cover" />
        </div>

        <div class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors">
            {{ editingId ? 'Güncelle' : 'Yayınla' }}
          </button>
          <button v-if="editingId" type="button" @click="resetForm" class="text-slate-500 px-3 py-2">İptal</button>
        </div>
        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>

    <h2 class="font-semibold text-petlas-navy mb-3">Yayınlanmış Haberler</h2>
    <div class="space-y-2">
      <div v-for="h in haberler" :key="h.id" class="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <img v-if="h.gorsel_url" :src="h.gorsel_url" class="w-14 h-14 rounded object-cover shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-petlas-navy truncate">{{ h.baslik }}</p>
            <p class="text-xs text-slate-400">{{ new Date(h.created_at).toLocaleDateString('tr-TR') }}</p>
          </div>
        </div>
        <div class="flex gap-2 text-sm shrink-0">
          <button @click="editHaber(h)" class="text-petlas-blue hover:underline">Düzenle</button>
          <button @click="deleteHaber(h.id)" class="text-petlas-red hover:underline">Sil</button>
        </div>
      </div>
      <p v-if="haberler.length === 0" class="text-slate-400 text-sm">Henüz haber eklenmedi.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/axios'

const haberler = ref([])
const editingId = ref(null)
const message = ref('')
const messageIsError = ref(false)
const form = reactive({ baslik: '', icerik: '', gorselUrl: '' })

async function loadHaberler() {
  const res = await api.get('/haberler')
  haberler.value = res.data
}

async function onGorselSecildi(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    form.gorselUrl = res.data.url
  } catch (err) {
    message.value = err.response?.data?.error || 'Görsel yüklenemedi.'
    messageIsError.value = true
  }
}

function resetForm() {
  editingId.value = null
  form.baslik = ''
  form.icerik = ''
  form.gorselUrl = ''
}

async function submitForm() {
  message.value = ''
  try {
    if (editingId.value) {
      await api.put(`/haberler/${editingId.value}`, form)
      message.value = 'Haber güncellendi.'
    } else {
      await api.post('/haberler', form)
      message.value = 'Haber yayınlandı.'
    }
    messageIsError.value = false
    resetForm()
    loadHaberler()
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

function editHaber(h) {
  editingId.value = h.id
  form.baslik = h.baslik
  form.icerik = h.icerik
  form.gorselUrl = h.gorsel_url || ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteHaber(id) {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return
  await api.delete(`/haberler/${id}`)
  loadHaberler()
}

onMounted(loadHaberler)
</script>
