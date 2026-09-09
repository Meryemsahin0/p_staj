<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Kullanıcı Yönetimi</h1>
    <p class="text-slate-500 text-sm mb-6">
      Kullanıcıları görüntüle, rol/departman ata, şeflik ver/al, hesap sil.
      <span v-if="!auth.isEffectiveAdmin">Bir departman şefi olarak sadece kendi departmanınızdaki kullanıcıları yönetebilirsiniz.</span>
      Yeni roller <router-link to="/admin/roller" class="text-petlas-blue hover:underline">Roller &amp; Yetkiler</router-link> sayfasından oluşturulur.
    </p>

    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="text-left px-4 py-2">Kullanıcı Adı</th>
            <th class="text-left px-4 py-2">E-posta</th>
            <th class="text-left px-4 py-2">Rol</th>
            <th class="text-left px-4 py-2">Departman</th>
            <th class="text-left px-4 py-2">Şef mi?</th>
            <th class="text-left px-4 py-2">Karışım Yetkisi</th>
            <th class="text-left px-4 py-2">Admin Yetkisi</th>
            <th class="text-left px-4 py-2">Durum</th>
            <th class="text-left px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t border-slate-200">
            <td class="px-4 py-2 font-medium text-petlas-navy">{{ u.username }}</td>
            <td class="px-4 py-2 text-slate-500">{{ u.email }}</td>
            <td class="px-4 py-2">
              <span v-if="u.role === 'ADMIN'" class="text-xs bg-petlas-red text-white px-2 py-0.5 rounded font-semibold">Sistem Yöneticisi (Sabit)</span>
              <select v-else :value="u.role" @change="changeRole(u, $event.target.value)" class="border border-slate-300 rounded px-2 py-1">
                <option v-for="r in assignableRoles" :key="r.id" :value="r.role_name">{{ r.role_name }}</option>
              </select>
            </td>
            <td class="px-4 py-2">
              <select v-if="u.role !== 'ADMIN' && auth.isEffectiveAdmin" :value="u.department || ''" @change="changeDepartment(u, $event.target.value)" class="border border-slate-300 rounded px-2 py-1">
                <option value="">— Yok —</option>
                <option value="SAHA_MUHENDISLIGI">Saha Mühendisliği</option>
                <option value="TEKNIK_SERVIS">Teknik Servis</option>
              </select>
              <span v-else class="text-xs text-slate-500">{{ departmanEtiketi(u.department) }}</span>
            </td>
            <td class="px-4 py-2">
              <label v-if="u.role !== 'ADMIN' && auth.isEffectiveAdmin" class="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" :checked="u.is_chief" :disabled="!u.department" @change="toggleChief(u)" />
                <span class="text-xs" :class="u.is_chief ? 'text-petlas-navy font-semibold' : 'text-slate-400'">{{ u.is_chief ? 'Şef' : '—' }}</span>
              </label>
              <span v-else class="text-xs" :class="u.is_chief ? 'text-petlas-navy font-semibold' : 'text-slate-300'">{{ u.is_chief ? 'Şef' : '—' }}</span>
            </td>
            <td class="px-4 py-2">
              <label v-if="u.department === 'SAHA_MUHENDISLIGI' && (auth.isEffectiveAdmin || auth.isSahaChief)" class="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" :checked="u.can_manage_karisim" @change="toggleKarisimYetkisi(u)" />
                <span class="text-xs" :class="u.can_manage_karisim ? 'text-petlas-navy font-semibold' : 'text-slate-400'">{{ u.can_manage_karisim ? 'Verildi' : 'Yok' }}</span>
              </label>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-4 py-2">
              <span v-if="u.role === 'ADMIN'" class="text-xs text-slate-400">Zaten tam yetkili</span>
              <label v-else-if="auth.isEffectiveAdmin" class="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" :checked="u.admin_yetkisi" @change="toggleAdminYetkisi(u)" />
                <span class="text-xs" :class="u.admin_yetkisi ? 'text-petlas-red font-semibold' : 'text-slate-400'">{{ u.admin_yetkisi ? 'Verildi' : 'Yok' }}</span>
              </label>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-4 py-2">
              <span :class="u.is_active ? 'text-green-600' : 'text-red-600'">{{ u.is_active ? 'Aktif' : 'Pasif' }}</span>
            </td>
            <td class="px-4 py-2 space-x-2 whitespace-nowrap">
              <button @click="toggleStatus(u)" class="text-petlas-blue hover:underline text-xs">
                {{ u.is_active ? 'Pasifleştir' : 'Aktifleştir' }}
              </button>
              <button v-if="u.role !== 'ADMIN'" @click="deleteUser(u)" class="text-petlas-red hover:underline text-xs">Sil</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-white rounded-lg shadow p-5 mt-8">
      <h2 class="font-semibold text-petlas-navy mb-3">Yeni Kullanıcı Ekle</h2>
      <p class="text-xs text-slate-400 mb-3">ADMIN rolü sabittir ve buradan atanamaz; gerekirse bir kullanıcıya "admin yetkisi" verebilirsiniz.</p>
      <form @submit.prevent="createUser" class="grid sm:grid-cols-2 gap-3">
        <input v-model="newUser.username" placeholder="Kullanıcı adı" required class="border border-slate-300 rounded px-3 py-2" />
        <input v-model="newUser.email" type="email" placeholder="E-posta" required class="border border-slate-300 rounded px-3 py-2" />
        <input v-model="newUser.password" type="password" placeholder="Geçici şifre" required minlength="6" class="border border-slate-300 rounded px-3 py-2" />
        <select v-model="newUser.roleName" class="border border-slate-300 rounded px-3 py-2">
          <option v-for="r in assignableRoles" :key="r.id" :value="r.role_name">{{ r.role_name }}</option>
        </select>
        <select v-if="auth.isEffectiveAdmin" v-model="newUser.department" class="border border-slate-300 rounded px-3 py-2 sm:col-span-2">
          <option value="">Departman seçin (opsiyonel)</option>
          <option value="SAHA_MUHENDISLIGI">Saha Mühendisliği</option>
          <option value="TEKNIK_SERVIS">Teknik Servis</option>
        </select>
        <p v-else class="text-xs text-slate-400 sm:col-span-2">Yeni kullanıcı otomatik olarak sizin departmanınıza ({{ departmanEtiketi(auth.department) }}) eklenecek.</p>
        <button type="submit" class="sm:col-span-2 bg-petlas-red hover:bg-red-700 text-white font-semibold py-2 rounded transition-colors">Kullanıcı Oluştur</button>
        <p v-if="message" class="sm:col-span-2 text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const users = ref([])
const roles = ref([])
const message = ref('')
const messageIsError = ref(false)
const newUser = reactive({ username: '', email: '', password: '', roleName: 'STAJYER', personelTipi: '', department: '' })

// ADMIN rolü sabittir ve buradan hiç kimseye atanamaz; sadece diğer roller listelenir.
const assignableRoles = computed(() => roles.value.filter(r => r.role_name !== 'ADMIN'))

function departmanEtiketi(dep) {
  if (dep === 'SAHA_MUHENDISLIGI') return 'Saha Mühendisliği'
  if (dep === 'TEKNIK_SERVIS') return 'Teknik Servis'
  return '—'
}

async function loadUsers() {
  // Departman şefleri için backend zaten sadece kendi departmanındaki kullanıcıları döndürür.
  const res = await api.get('/users')
  users.value = res.data
}

async function loadRoles() {
  const res = await api.get('/roles')
  roles.value = res.data
}

async function changeRole(user, roleName) {
  try {
    await api.patch(`/users/${user.id}/role`, { roleName, personelTipi: roleName === 'PERSONEL' ? user.personel_tipi : null })
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Rol güncellenemedi.')
  }
}

async function changeDepartment(user, department) {
  try {
    await api.patch(`/users/${user.id}/department`, { department: department || null })
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Departman güncellenemedi.')
  }
}

async function toggleChief(user) {
  try {
    await api.patch(`/users/${user.id}/chief`, { isChief: !user.is_chief })
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Şeflik güncellenemedi.')
  }
}

async function toggleKarisimYetkisi(user) {
  try {
    await api.patch(`/users/${user.id}/karisim-yetkisi`, { canManageKarisim: !user.can_manage_karisim })
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Karışım yetkisi güncellenemedi.')
  }
}

async function toggleAdminYetkisi(user) {
  try {
    await api.patch(`/users/${user.id}/admin-yetkisi`, { adminYetkisi: !user.admin_yetkisi })
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Admin yetkisi güncellenemedi.')
  }
}

async function toggleStatus(user) {
  await api.patch(`/users/${user.id}/status`, { isActive: !user.is_active })
  loadUsers()
}

async function deleteUser(user) {
  if (!confirm(`${user.username} kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?`)) return
  try {
    await api.delete(`/users/${user.id}`)
    loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

async function createUser() {
  message.value = ''
  try {
    await api.post('/auth/register', newUser)
    message.value = 'Kullanıcı başarıyla oluşturuldu.'
    messageIsError.value = false
    newUser.username = ''; newUser.email = ''; newUser.password = ''; newUser.roleName = 'STAJYER'; newUser.personelTipi = ''; newUser.department = ''
    loadUsers()
  } catch (err) {
    message.value = err.response?.data?.error || 'Kullanıcı oluşturulamadı.'
    messageIsError.value = true
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>
