<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="font-semibold text-petlas-navy text-sm mb-3">{{ title }}</h3>
    <p v-if="!data || data.length === 0" class="text-slate-400 text-sm">Henüz veri yok.</p>
    <div v-else class="space-y-2">
      <div v-for="row in data" :key="row.label" class="flex items-center gap-2 text-xs">
        <span class="w-28 shrink-0 truncate text-slate-600" :title="row.label">{{ row.label }}</span>
        <div class="flex-1 bg-slate-100 rounded h-4 overflow-hidden">
          <div class="h-4 rounded" :style="{ width: pct(row.count) + '%', backgroundColor: color }"></div>
        </div>
        <span class="w-6 text-right font-semibold text-petlas-navy">{{ row.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] }, // [{ label, count }]
  color: { type: String, default: '#dc2626' }
})

const maxCount = computed(() => Math.max(1, ...props.data.map(d => d.count)))
function pct(count) {
  return Math.max(4, Math.round((count / maxCount.value) * 100))
}
</script>
