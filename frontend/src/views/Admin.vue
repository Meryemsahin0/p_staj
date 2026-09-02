<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Yönetim Paneli</h1>
    <p class="text-slate-500 text-sm mb-6">Teknik dokümanları ekle, düzenle veya sil.</p>

    <div class="bg-white rounded-lg shadow p-5 mb-8">
      <h2 class="font-semibold text-petlas-navy mb-3">{{ editingId ? 'Dokümanı Düzenle' : 'Yeni Doküman Ekle' }}</h2>
      <form @submit.prevent="submitForm" class="space-y-3">
        <input v-model="form.title" placeholder="Başlık (örn: 22.5 İnç Jant Tork Değerleri)" required
          class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red" />
        <textarea v-model="form.content" placeholder="İçerik / teknik detay" rows="4" required
          class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-petlas-red"></textarea>
        <div class="flex gap-3 flex-wrap">
          <select v-model="form.categoryId" class="flex-1 border border-slate-300 rounded px-3 py-2">
            <option value="">Kategori seçin</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.category_name }}</option>
          </select>
          <input v-model="form.keywords" placeholder="Anahtar kelimeler (virgülle ayırın)"
            class="flex-1 border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">PDF veya Görsel Ek (opsiyonel)</label>
          <input type="file" accept=".pdf,image/*" @change="onFileSelected"
            class="w-full text-sm border border-slate-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-petlas-navy file:text-white file:text-xs" />
          <p v-if="uploading" class="text-xs text-slate-500 mt-1">Dosya yükleniyor...</p>
          <p v-else-if="form.filePath" class="text-xs text-green-600 mt-1">Yüklendi: {{ form.filePath }}</p>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors">
            {{ editingId ? 'Güncelle' : 'Ekle' }}
          </button>
          <button v-if="editingId" type="button" @click="resetForm" class="text-slate-500 px-3 py-2">İptal</button>
        </div>
        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>

    <h2 class="font-semibold text-petlas-navy mb-3">Mevcut Dokümanlar</h2>
    <div class="space-y-2">
      <div v-for="doc in documents" :key="doc.id" class="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-petlas-navy">{{ doc.title }}</p>
          <p class="text-xs text-slate-400">{{ doc.category || 'Genel' }}</p>
        </div>
        <div class="flex gap-2 text-sm">
          <button @click="editDoc(doc)" class="text-petlas-blue hover:underline">Düzenle</button>
          <button @click="deleteDoc(doc.id)" class="text-petlas-red hover:underline">Sil</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/axios'

const categories = ref([])
const documents = ref([])
const editingId = ref(null)
const message = ref('')
const messageIsError = ref(false)
const uploading = ref(false)

const form = reactive({ title: '', content: '', categoryId: '', keywords: '', filePath: '' })

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  message.value = ''
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

async function loadCategories() {
  const res = await api.get('/categories')
  categories.value = res.data
}

async function loadDocuments() {
  const res = await api.get('/documents/search')
  documents.value = res.data
}

function resetForm() {
  editingId.value = null
  form.title = ''
  form.content = ''
  form.categoryId = ''
  form.keywords = ''
  form.filePath = ''
}

async function submitForm() {
  message.value = ''
  try {
    const payload = { title: form.title, content: form.content, categoryId: form.categoryId || null, keywords: form.keywords, filePath: form.filePath || null }
    if (editingId.value) {
      await api.put(`/documents/${editingId.value}`, payload)
      message.value = 'Doküman güncellendi.'
    } else {
      await api.post('/documents', payload)
      message.value = 'Doküman eklendi.'
    }
    messageIsError.value = false
    resetForm()
    loadDocuments()
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

function editDoc(doc) {
  editingId.value = doc.id
  form.title = doc.title
  form.content = doc.content
  form.categoryId = ''
  form.keywords = doc.keywords || ''
}

async function deleteDoc(id) {
  if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/documents/${id}`)
    loadDocuments()
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

onMounted(() => {
  loadCategories()
  loadDocuments()
})
</script>
