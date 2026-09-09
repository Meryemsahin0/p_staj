<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Roller &amp; Yetkiler</h1>
    <p class="text-slate-500 text-sm mb-6">
      {{ auth.isEffectiveAdmin ? 'Yeni roller oluşturun ve her rolün hangi sayfalara/işlemlere erişebileceğini belirleyin. ADMIN rolü sabittir ve her zaman tam yetkilidir.' : 'Kendi departmanınıza ait izinleri (aşağıda etkin olan kutucuklar) düzenleyebilirsiniz. Yeni rol oluşturma ve diğer departmana ait izinler sadece yöneticide.' }}
    </p>

    <div v-if="auth.isEffectiveAdmin" class="bg-white rounded-lg shadow p-5 mb-8">
      <h2 class="font-semibold text-petlas-navy mb-3">Yeni Rol Oluştur</h2>
      <form @submit.prevent="createRole" class="space-y-3">
        <div class="grid sm:grid-cols-2 gap-3">
          <input v-model="newRole.roleName" placeholder="Rol adı (örn: KALITE_KONTROL)" required class="border border-slate-300 rounded px-3 py-2" />
          <input v-model="newRole.description" placeholder="Açıklama (opsiyonel)" class="border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-600 mb-2">Bu role verilecek yetkiler:</p>
          <div class="grid sm:grid-cols-2 gap-2">
            <label v-for="p in catalog" :key="p.perm_key" class="flex items-center gap-2 text-sm border border-slate-200 rounded px-3 py-2 cursor-pointer">
              <input type="checkbox" :value="p.perm_key" v-model="newRole.permissionKeys" />
              <span>{{ p.description || p.perm_key }}</span>
            </label>
          </div>
        </div>
        <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors">Rol Oluştur</button>
        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>
      </form>
    </div>
    <p v-if="!auth.isEffectiveAdmin && message" class="text-sm mb-4" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>

    <h2 class="font-semibold text-petlas-navy mb-3">Mevcut Roller</h2>
    <div class="space-y-4">
      <div v-for="r in roles" :key="r.id" class="bg-white rounded-lg shadow p-5">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <p class="font-semibold text-petlas-navy">
              {{ r.role_name }}
              <span v-if="r.role_name === 'ADMIN'" class="text-xs bg-petlas-red text-white px-2 py-0.5 rounded font-semibold ml-1">Sabit / Tam Yetkili</span>
            </p>
            <p class="text-xs text-slate-400">{{ r.description || 'Açıklama yok' }} · {{ r.userCount }} kullanıcı</p>
          </div>
          <button v-if="auth.isEffectiveAdmin && !['ADMIN','PERSONEL','STAJYER'].includes(r.role_name) && r.userCount === 0"
            @click="deleteRole(r)" class="text-petlas-red hover:underline text-xs">Rolü Sil</button>
        </div>

        <div v-if="r.role_name !== 'ADMIN'" class="grid sm:grid-cols-2 gap-2 mb-3">
          <label v-for="p in catalog" :key="p.perm_key"
            class="flex items-center gap-2 text-sm border rounded px-3 py-2"
            :class="izinDuzenlenebilirMi(p.perm_key) ? 'border-slate-200 cursor-pointer' : 'border-slate-100 opacity-50 cursor-not-allowed'">
            <input type="checkbox" :value="p.perm_key" v-model="draftPermissions[r.id]" :disabled="!izinDuzenlenebilirMi(p.perm_key)" />
            <span>{{ p.description || p.perm_key }}</span>
          </label>
        </div>
        <button v-if="r.role_name !== 'ADMIN'" @click="savePermissions(r)"
          class="bg-petlas-navy hover:bg-slate-800 text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors">
          Yetkileri Kaydet
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const roles = ref([])
const catalog = ref([])
const draftPermissions = reactive({})
const message = ref('')
const messageIsError = ref(false)
const newRole = reactive({ roleName: '', description: '', permissionKeys: [] })

// Backend'deki departman-izin eşlemesiyle aynı: bir şef, sadece kendi departmanına
// ait izinleri değiştirebilir (CREATE_DOCUMENTS gibi departmana bağlı olmayanlar admin'e özeldir).
const PERM_DEPARTMENT_MAP = {
  VIEW_TIRE_TESTS: 'SAHA_MUHENDISLIGI', CREATE_TIRE_TESTS: 'SAHA_MUHENDISLIGI',
  VIEW_KABUL_RET: 'TEKNIK_SERVIS', CREATE_KABUL_RET: 'TEKNIK_SERVIS'
}
function izinDuzenlenebilirMi(permKey) {
  if (auth.isEffectiveAdmin) return true
  return PERM_DEPARTMENT_MAP[permKey] === auth.department
}

async function loadCatalog() {
  const res = await api.get('/roles/permissions-catalog')
  catalog.value = res.data
}

async function loadRoles() {
  const res = await api.get('/roles')
  roles.value = res.data
  for (const r of res.data) {
    draftPermissions[r.id] = [...(r.permissions || [])]
  }
}

async function createRole() {
  message.value = ''
  try {
    await api.post('/roles', newRole)
    message.value = 'Rol oluşturuldu.'
    messageIsError.value = false
    newRole.roleName = ''; newRole.description = ''; newRole.permissionKeys = []
    loadRoles()
  } catch (err) {
    message.value = err.response?.data?.error || 'Rol oluşturulamadı.'
    messageIsError.value = true
  }
}

async function savePermissions(role) {
  try {
    await api.put(`/roles/${role.id}/permissions`, { permissionKeys: draftPermissions[role.id] || [] })
    message.value = `"${role.role_name}" rolünün yetkileri güncellendi.`
    messageIsError.value = false
    loadRoles()
  } catch (err) {
    message.value = err.response?.data?.error || 'Yetkiler güncellenemedi.'
    messageIsError.value = true
  }
}

async function deleteRole(role) {
  if (!confirm(`"${role.role_name}" rolünü silmek istediğinize emin misiniz?`)) return
  try {
    await api.delete(`/roles/${role.id}`)
    loadRoles()
  } catch (err) {
    alert(err.response?.data?.error || 'Rol silinemedi.')
  }
}

onMounted(() => {
  loadCatalog()
  loadRoles()
})
</script>
