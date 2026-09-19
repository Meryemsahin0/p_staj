<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-petlas-navy mb-1">Güvenlik Denetim Logları</h1>
    <p class="text-slate-500 text-sm mb-6">Sistemde yapılan işlemlerin (giriş, kayıt ekleme/düzenleme/silme, doküman görüntüleme vb.) kronolojik kaydı. Departman şefleri sadece kendi departmanındaki kullanıcıların loglarını görür; admin tüm logları görür.</p>

    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-petlas-navy text-white">
          <tr>
            <th class="text-left px-4 py-2">Zaman</th>
            <th class="text-left px-4 py-2">Kullanıcı</th>
            <th class="text-left px-4 py-2">Eylem</th>
            <th class="text-left px-4 py-2">Endpoint</th>
            <th class="text-left px-4 py-2">IP</th>
            <th class="text-left px-4 py-2">Detay</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="border-t border-slate-200">
            <td class="px-4 py-2 text-slate-500 whitespace-nowrap">{{ formatDate(log.timestamp) }}</td>
            <td class="px-4 py-2 font-medium text-petlas-navy">{{ log.username || '—' }}</td>
            <td class="px-4 py-2"><span class="text-xs bg-blue-100 text-petlas-blue px-2 py-0.5 rounded font-medium">{{ log.action }}</span></td>
            <td class="px-4 py-2 text-slate-500">{{ log.endpoint }}</td>
            <td class="px-4 py-2 text-slate-400">{{ log.ip_address }}</td>
            <td class="px-4 py-2 text-slate-500">{{ log.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const logs = ref([])

function formatDate(ts) {
  return new Date(ts).toLocaleString('tr-TR')
}

onMounted(async () => {
  const res = await api.get('/audit-logs')
  logs.value = res.data
})
</script>
