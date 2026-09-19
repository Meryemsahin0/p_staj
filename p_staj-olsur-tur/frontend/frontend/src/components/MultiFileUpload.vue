<template>
  <div>
    <label class="block text-xs font-medium text-slate-600 mb-1">
      {{ label }} <span class="text-slate-400 font-normal">(en fazla 10 dosya — PDF veya görsel)</span>
    </label>
    <input type="file" multiple accept=".pdf,image/*" @change="onFilesSelected"
      class="w-full text-sm border border-slate-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-petlas-navy file:text-white file:text-xs" />
    <p v-if="uploading" class="text-xs text-slate-500 mt-1">Yükleniyor...</p>
    <p v-if="error" class="text-xs text-red-600 mt-1">{{ error }}</p>

    <div v-if="allFiles.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      <div v-for="(f, i) in allFiles" :key="f.url + i" class="relative border border-slate-200 rounded overflow-hidden bg-slate-50 group">
        <a :href="f.url" target="_blank" class="block">
          <img v-if="isImage(f)" :src="f.url" class="w-full h-20 object-cover" />
          <div v-else class="w-full h-20 flex flex-col items-center justify-center text-slate-500">
            <span class="text-xs font-semibold">PDF</span>
            <span class="text-[10px] px-1 truncate w-full text-center">{{ f.originalName || 'PDF' }}</span>
          </div>
        </a>
        <button v-if="editable" type="button" @click="removeFile(i)"
          class="absolute top-0.5 right-0.5 bg-petlas-red text-white text-[10px] w-4 h-4 rounded-full leading-none flex items-center justify-center opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../api/axios'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // yeni yüklenenler: [{url, originalName, mimeType}]
  existing: { type: Array, default: () => [] },   // sunucudan gelen mevcut ekler (görüntüleme amaçlı)
  label: { type: String, default: 'Belgeler / Görseller' },
  editable: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const error = ref('')

const allFiles = computed(() => [
  ...props.existing.map(e => ({ url: e.file_path, originalName: e.original_name, mimeType: e.mime_type })),
  ...props.modelValue
])

function isImage(f) {
  return (f.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(f.url || '')
}

async function onFilesSelected(e) {
  const selected = Array.from(e.target.files || [])
  if (selected.length === 0) return
  error.value = ''

  const totalAfter = props.existing.length + props.modelValue.length + selected.length
  if (totalAfter > 10) {
    error.value = `En fazla 10 dosya ekleyebilirsiniz (şu an ${props.existing.length + props.modelValue.length} dosya var).`
    e.target.value = ''
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    selected.forEach(f => formData.append('files', f))
    const res = await api.post('/uploads/multi', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    emit('update:modelValue', [...props.modelValue, ...res.data.files])
  } catch (err) {
    error.value = err.response?.data?.error || 'Dosyalar yüklenemedi.'
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function removeFile(i) {
  // Sadece bu oturumda henüz kaydedilmemiş (yeni yüklenen) dosyalar listeden çıkarılabilir.
  const existingCount = props.existing.length
  if (i < existingCount) return // mevcut (kayıtlı) ekler ayrı bir akışla (attachments API) silinir, burada değil
  const idx = i - existingCount
  const copy = [...props.modelValue]
  copy.splice(idx, 1)
  emit('update:modelValue', copy)
}
</script>
