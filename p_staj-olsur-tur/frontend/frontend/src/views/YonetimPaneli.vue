<template>
  <div class="max-w-5xl mx-auto px-4 pt-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Yönetim Paneli</h1>
    <p class="text-slate-500 text-sm mb-6">Yetkinize göre aşağıdaki bölümlere erişebilirsiniz.</p>

    <div class="flex flex-wrap gap-1 border-b border-slate-300 mb-2">
      <button v-for="tab in gorunurSekmeler" :key="tab.key" @click="aktifSekme = tab.key"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="aktifSekme === tab.key ? 'border-petlas-red text-petlas-red' : 'border-transparent text-slate-500 hover:text-petlas-navy'">
        {{ tab.label }}
      </button>
    </div>
  </div>

  <component :is="aktifBilesen" v-if="aktifBilesen" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import AdminUsers from './AdminUsers.vue'
import AdminRoles from './AdminRoles.vue'
import AdminErrorCodes from './AdminErrorCodes.vue'
import OzellikYonetimi from './KarisimYonetimi.vue'
import AdminLogs from './AdminLogs.vue'
import HaberYonetimi from './HaberYonetimi.vue'

const auth = useAuthStore()

const tumSekmeler = [
  { key: 'kullanicilar', label: 'Kullanıcılar', gorunur: () => auth.isEffectiveAdmin || auth.isAnyChief, bilesen: AdminUsers },
  { key: 'roller', label: 'Roller ve Yetkiler', gorunur: () => auth.isEffectiveAdmin || auth.isAnyChief, bilesen: AdminRoles },
  { key: 'hatakodlari', label: 'Hata Kodları', gorunur: () => auth.isEffectiveAdmin || auth.isTeknikServisChief, bilesen: AdminErrorCodes },
  { key: 'ozellikler', label: 'Özellikler', gorunur: () => auth.canManageKarisim, bilesen: OzellikYonetimi },
  { key: 'haberler', label: 'Petlas Gündem Yönetimi', gorunur: () => auth.isEffectiveAdmin, bilesen: HaberYonetimi },
  { key: 'loglar', label: 'Denetim Logları', gorunur: () => auth.isEffectiveAdmin, bilesen: AdminLogs }
]

const gorunurSekmeler = computed(() => tumSekmeler.filter(t => t.gorunur()))
const aktifSekme = ref(gorunurSekmeler.value[0]?.key || '')
const aktifBilesen = computed(() => gorunurSekmeler.value.find(t => t.key === aktifSekme.value)?.bilesen)
</script>
