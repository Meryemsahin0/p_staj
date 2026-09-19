<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Doküman Ekle</h1>
    <p class="text-slate-500 text-sm mb-6">Teknik dokümanları ekle, düzenle veya sil. Her belgeye 1-10 arası PDF/görsel ekleyebilir ve hangi departmana ait olduğunu belirleyebilirsiniz.</p>

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

        <MultiFileUpload v-model="newFiles" :existing="existingAttachments" label="PDF veya Görsel Ekler" />

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Bu belge hangi departmana ait?</label>
          <select v-model="form.department" class="w-full border border-slate-300 rounded px-3 py-2">
            <option value="GENEL">Genel (herkes görebilir)</option>
            <option value="SAHA_MUHENDISLIGI">Saha Mühendisliği (sadece o departman + admin)</option>
            <option value="TEKNIK_SERVIS">Teknik Servis (sadece o departman + admin)</option>
          </select>
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
      <div v-for="doc in documents" :key="doc.id" class="bg-white rounded-lg shadow p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="font-medium text-petlas-navy">{{ doc.title }}</p>
          <p class="text-xs text-slate-400">{{ doc.category || 'Genel' }} <span class="font-medium">· {{ departmanEtiketi(doc.department) }}</span></p>
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
import MultiFileUpload from '../components/MultiFileUpload.vue'

const categories = ref([])
const documents = ref([])
const editingId = ref(null)
const message = ref('')
const messageIsError = ref(false)
const newFiles = ref([])
const existingAttachments = ref([])

const form = reactive({ title: '', content: '', categoryId: '', keywords: '', department: 'GENEL' })

function departmanEtiketi(dep) {
  if (dep === 'SAHA_MUHENDISLIGI') return 'Saha Mühendisliği'
  if (dep === 'TEKNIK_SERVIS') return 'Teknik Servis'
  return 'Genel'
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
  form.department = 'GENEL'
  newFiles.value = []
  existingAttachments.value = []
}

async function submitForm() {
  message.value = ''
  try {
    const payload = {
      title: form.title,
      content: form.content,
      categoryId: form.categoryId || null,
      keywords: form.keywords,
      files: newFiles.value,
      department: form.department
    }
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

async function editDoc(doc) {
  editingId.value = doc.id
  form.title = doc.title
  form.content = doc.content
  form.categoryId = ''
  form.keywords = doc.keywords || ''
  form.department = doc.department || 'GENEL'
  newFiles.value = []
  try {
    const res = await api.get(`/documents/${doc.id}`)
    existingAttachments.value = res.data.attachments || []
  } catch { /* detay çekilemezse form yine de temel bilgilerle düzenlenebilir */ }
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
