<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Profilim</h1>
    <p class="text-slate-500 text-sm mb-6">Hesap bilgilerinizi görüntüleyin ve güncelleyin.</p>

    <div v-if="profile" class="bg-white rounded-lg shadow p-6 space-y-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-petlas-navy text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
          <img v-if="profile.profil_foto" :src="profile.profil_foto" class="w-full h-full object-cover" />
          <span v-else>{{ profile.username?.[0]?.toUpperCase() }}</span>
        </div>
        <div>
          <p class="font-semibold text-petlas-navy text-lg">{{ profile.username }}</p>
          <p class="text-xs text-slate-500">
            <span class="bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ roleLabel(profile.role) }}</span>
            <span v-if="profile.personel_tipi" class="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{{ profile.personel_tipi === 'TEKNIK_SERVIS' ? 'Teknik Servis' : 'Saha' }}</span>
            <span v-if="profile.admin_yetkisi" class="ml-1 bg-red-100 text-petlas-red px-2 py-0.5 rounded font-medium">Admin Yetkili</span>
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Profil Fotoğrafı</label>
        <input type="file" accept="image/*" @change="onPhotoSelected"
          class="w-full text-sm border border-slate-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-petlas-navy file:text-white file:text-xs" />
        <p v-if="uploading" class="text-xs text-slate-500 mt-1">Yükleniyor...</p>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-3 border-t border-slate-200 pt-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">E-posta</label>
          <input v-model="form.email" type="email" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)</label>
          <input v-model="form.password" type="password" minlength="6" class="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
        <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors">Kaydet</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const profile = ref(null)
const uploading = ref(false)
const message = ref('')
const messageIsError = ref(false)
const form = reactive({ email: '', password: '' })

function roleLabel(role) {
  return { ADMIN: 'Sistem Yöneticisi', PERSONEL: 'Personel', STAJYER: 'Stajyer' }[role] || role
}

async function loadProfile() {
  const res = await api.get('/users/me')
  profile.value = res.data
  form.email = res.data.email
}

async function onPhotoSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/uploads/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    await api.patch('/users/me', { profilFoto: res.data.url })
    await loadProfile()
    message.value = 'Profil fotoğrafı güncellendi.'
    messageIsError.value = false
  } catch (err) {
    message.value = err.response?.data?.error || 'Fotoğraf yüklenemedi.'
    messageIsError.value = true
  } finally {
    uploading.value = false
  }
}

async function saveProfile() {
  message.value = ''
  try {
    const payload = { email: form.email }
    if (form.password) payload.password = form.password
    await api.patch('/users/me', payload)
    message.value = 'Profil güncellendi.'
    messageIsError.value = false
    form.password = ''
    // auth store'daki e-postayı da güncelle
    if (auth.user) {
      auth.user.email = form.email
      localStorage.setItem('petlas_user', JSON.stringify(auth.user))
    }
  } catch (err) {
    message.value = err.response?.data?.error || 'Güncelleme başarısız.'
    messageIsError.value = true
  }
}

onMounted(loadProfile)
</script>
