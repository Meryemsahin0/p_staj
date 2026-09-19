<template>
  <div class="min-h-screen bg-slate-100 flex">
    <!-- Sidebar aç/kapa düğmesi (sidebar kapalıyken sabit görünür) -->
    <button v-if="auth.isAuthenticated && !sidebarOpen" @click="sidebarOpen = true"
      class="fixed top-4 left-4 z-40 bg-petlas-navy text-white w-10 h-10 rounded flex items-center justify-center shadow-lg">
      <span class="text-xl leading-none">&#9776;</span>
    </button>

    <!-- Sol Menü (Sidebar) -->
    <aside v-if="auth.isAuthenticated"
      class="fixed inset-y-0 left-0 z-30 w-64 bg-petlas-navy border-r-4 border-petlas-red transform transition-transform duration-200 flex flex-col"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="px-4 py-5 flex items-center gap-2 border-b border-slate-700">
        <img src="./assets/petlas-logo.png" alt="Petlas" class="h-7 bg-white rounded px-1 py-0.5" />
        <div class="flex-1">
          <p class="text-white font-bold text-sm leading-tight">PETLAS</p>
          <p class="text-slate-400 text-[10px]">SSH Bilgi Tabanı</p>
        </div>
        <button @click="sidebarOpen = false" class="text-slate-400 hover:text-white text-lg leading-none px-1">&#9776;</button>
      </div>

      <nav class="flex-1 overflow-y-auto py-3 space-y-1 px-2 text-sm">
        <router-link to="/anasayfa" class="sidebar-link">Ana Sayfa</router-link>
        <router-link v-if="auth.can('VIEW_TIRE_TESTS')" to="/lastik-testleri" class="sidebar-link">Lastik Test Formu</router-link>
        <router-link v-if="auth.can('VIEW_KABUL_RET')" to="/kabul-ret" class="sidebar-link">Teknik Servis</router-link>
        <router-link v-if="auth.can('CREATE_DOCUMENTS')" to="/admin" class="sidebar-link">Doküman Ekle</router-link>
        <router-link v-if="auth.isEffectiveAdmin || auth.isAnyChief || auth.canManageKarisim" to="/yonetim" class="sidebar-link">Yönetim Paneli</router-link>
        <router-link to="/profil" class="sidebar-link">Profilim</router-link>
      </nav>

      <div class="border-t border-slate-700 px-3 py-3">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-petlas-red text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            <img v-if="auth.user?.profilFoto" :src="auth.user.profilFoto" class="w-full h-full object-cover" />
            <span v-else>{{ auth.user?.username?.[0]?.toUpperCase() }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-white text-xs font-medium truncate">{{ auth.user?.username }}</p>
            <p class="text-slate-400 text-[10px]">{{ roleLabel }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full bg-petlas-red hover:bg-red-700 text-white text-xs font-semibold py-1.5 rounded transition-colors">Çıkış Yap</button>
      </div>
    </aside>

    <!-- İçerik -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-200" :class="auth.isAuthenticated && sidebarOpen ? 'lg:ml-64' : ''">
      <main class="flex-1">
        <router-view />
      </main>

      <footer class="text-center text-xs text-slate-500 py-4">
        Petlas Lastik San. ve Tic. A.Ş. — Satış Sonrası Hizmetler Müdürlüğü Teknik Servis &amp; Saha Mühendisliği
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(true)

const roleLabel = computed(() => {
  const base = { ADMIN: 'Sistem Yöneticisi', PERSONEL: 'Personel', STAJYER: 'Stajyer' }[auth.user?.role] || auth.user?.role
  const extra = []
  if (auth.user?.personelTipi) extra.push(auth.user.personelTipi === 'TEKNIK_SERVIS' ? 'Teknik Servis' : 'Saha')
  if (auth.user?.role !== 'ADMIN' && auth.user?.adminYetkisi) extra.push('Admin Yetkili')
  return extra.length ? `${base} · ${extra.join(' · ')}` : base
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style>
.sidebar-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  color: #cbd5e1;
  transition: all 0.15s;
}
.sidebar-link:hover {
  background-color: rgba(255,255,255,0.08);
  color: white;
}
.router-link-active.sidebar-link {
  background-color: #dc2626;
  color: white;
  font-weight: 600;
}
</style>
