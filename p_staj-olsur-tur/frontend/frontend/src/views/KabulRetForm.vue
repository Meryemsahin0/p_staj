<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <router-link to="/kabul-ret" class="text-sm text-petlas-blue hover:underline">&larr; Listeye dön</router-link>

    <div class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-amber-500 px-6 py-4">
        <h1 class="text-white text-xl font-bold">{{ isNew ? 'Yeni Kabul/Ret Kaydı' : (canEdit ? 'Kaydı Düzenle' : 'Kayıt Detayı') }}</h1>
      </div>

      <form @submit.prevent="submitForm" class="p-6 space-y-4">
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Lastik Seri No</label>
            <input v-model="form.lastikSeriNo" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Lastik Ebadı</label>
            <input v-model="form.lastikEbat" :disabled="!canEdit" placeholder="385/65 R22.5" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1">Müşteri</label>
            <input v-model="form.musteri" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Hata Kodu</label>
            <input v-model="form.hataKodu" :disabled="!canEdit" list="hata-kodu-liste" placeholder="Örn: E102"
              class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            <datalist id="hata-kodu-liste">
              <option v-for="ec in errorCodes" :key="ec.id" :value="ec.code">{{ ec.description }}</option>
            </datalist>
            <p class="text-[11px] text-slate-400 mt-0.5">Listede yoksa serbestçe yeni bir kod yazabilirsiniz.</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Karar</label>
            <select v-model="form.karar" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100">
              <option value="BEKLEMEDE">Beklemede</option>
              <option value="KABUL">Kabul</option>
              <option value="RET">Ret</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
          <textarea v-model="form.aciklama" :disabled="!canEdit" rows="4"
            class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100"></textarea>
        </div>

        <MultiFileUpload v-if="canEdit" v-model="newFiles" :existing="existingAttachments" label="Görseller / Belgeler" />
        <div v-else-if="existingAttachments.length > 0">
          <p class="block text-xs font-medium text-slate-600 mb-1">Görseller / Belgeler</p>
          <MultiFileUpload :model-value="[]" :existing="existingAttachments" :editable="false" />
        </div>

        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>

        <div v-if="canEdit" class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-6 py-2 rounded transition-colors">
            {{ isNew ? 'Kaydet' : 'Güncelle' }}
          </button>
          <button v-if="!isNew" type="button" @click="deleteRecord" class="text-petlas-red text-sm px-3 py-2">Sil</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'
import MultiFileUpload from '../components/MultiFileUpload.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isNew = computed(() => route.name === 'kabul-ret-new')
const canEdit = computed(() => auth.can('CREATE_KABUL_RET'))
const message = ref('')
const messageIsError = ref(false)
const errorCodes = ref([])
const newFiles = ref([])
const existingAttachments = ref([])

const form = reactive({
  lastikSeriNo: '', lastikEbat: '', musteri: '', hataKodu: '', karar: 'BEKLEMEDE', aciklama: ''
})

async function loadErrorCodes() {
  try {
    const res = await api.get('/error-codes')
    errorCodes.value = res.data
  } catch { /* opsiyonel öneri listesi, hata olursa formu engellemesin */ }
}

async function loadExisting() {
  const res = await api.get(`/kabul-ret/${route.params.id}`)
  const d = res.data
  form.lastikSeriNo = d.lastik_seri_no || ''
  form.lastikEbat = d.lastik_ebat || ''
  form.musteri = d.musteri || ''
  form.hataKodu = d.hata_kodu || ''
  form.karar = d.karar || 'BEKLEMEDE'
  form.aciklama = d.aciklama || ''
  existingAttachments.value = d.attachments || []
}

async function submitForm() {
  message.value = ''
  try {
    const payload = { ...form, files: newFiles.value }
    if (isNew.value) {
      const res = await api.post('/kabul-ret', payload)
      message.value = 'Kayıt oluşturuldu.'
      messageIsError.value = false
      router.push(`/kabul-ret/${res.data.id}`)
    } else {
      await api.put(`/kabul-ret/${route.params.id}`, payload)
      message.value = 'Kayıt güncellendi.'
      messageIsError.value = false
      newFiles.value = []
      loadExisting()
    }
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

async function deleteRecord() {
  if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/kabul-ret/${route.params.id}`)
    router.push('/kabul-ret')
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

onMounted(() => {
  loadErrorCodes()
  if (!isNew.value) loadExisting()
})
</script>
