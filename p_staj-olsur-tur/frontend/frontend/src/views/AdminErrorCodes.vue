<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Hata Kodları</h1>
    <p class="text-slate-500 text-sm mb-6">Teknik Servis kayıtlarında öneri olarak çıkan hata kodu kataloğu. Kayıtlarda hata kodu serbest metin olarak girilebilir; burası sadece bir öneri/otomatik tamamlama listesidir. Bu liste sadece Teknik Servis Şefi (ve admin) tarafından düzenlenir.</p>

    <div class="bg-white rounded-lg shadow p-5 mb-6">
      <h2 class="font-semibold text-petlas-navy mb-3">Yeni Hata Kodu Ekle</h2>
      <form @submit.prevent="createCode" class="grid sm:grid-cols-3 gap-3">
        <input v-model="newCode.code" placeholder="Kod (örn: E102)" required class="border border-slate-300 rounded px-3 py-2" />
        <input v-model="newCode.description" placeholder="Açıklama (opsiyonel)" class="sm:col-span-2 border border-slate-300 rounded px-3 py-2" />
        <button type="submit" class="sm:col-span-3 bg-petlas-red hover:bg-red-700 text-white font-semibold py-2 rounded transition-colors">Ekle</button>
        <p v-if="message" class="sm:col-span-3 text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="text-left px-4 py-2">Kod</th>
            <th class="text-left px-4 py-2">Açıklama</th>
            <th class="text-left px-4 py-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ec in codes" :key="ec.id" class="border-t border-slate-200">
            <td class="px-4 py-2 font-mono font-medium text-petlas-navy">{{ ec.code }}</td>
            <td class="px-4 py-2 text-slate-500">{{ ec.description || '—' }}</td>
            <td class="px-4 py-2"><button @click="deleteCode(ec.id)" class="text-petlas-red hover:underline text-xs">Sil</button></td>
          </tr>
          <tr v-if="codes.length === 0"><td colspan="3" class="px-4 py-4 text-slate-400 text-center">Henüz hata kodu eklenmedi.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/axios'

const codes = ref([])
const message = ref('')
const messageIsError = ref(false)
const newCode = reactive({ code: '', description: '' })

async function loadCodes() {
  const res = await api.get('/error-codes')
  codes.value = res.data
}

async function createCode() {
  message.value = ''
  try {
    await api.post('/error-codes', newCode)
    message.value = 'Hata kodu eklendi.'
    messageIsError.value = false
    newCode.code = ''; newCode.description = ''
    loadCodes()
  } catch (err) {
    message.value = err.response?.data?.error || 'Eklenemedi.'
    messageIsError.value = true
  }
}

async function deleteCode(id) {
  if (!confirm('Bu hata kodunu silmek istediğinize emin misiniz?')) return
  await api.delete(`/error-codes/${id}`)
  loadCodes()
}

onMounted(loadCodes)
</script>
