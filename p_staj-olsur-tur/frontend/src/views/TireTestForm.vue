<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <router-link to="/lastik-testleri" class="text-sm text-petlas-blue hover:underline">&larr; Listeye dön</router-link>

    <div class="bg-white rounded-lg shadow mt-4 overflow-hidden">
      <div class="bg-petlas-navy border-b-4 border-petlas-red px-6 py-4 flex items-center justify-between gap-3">
        <h1 class="text-white text-xl font-bold">{{ isNew ? 'Yeni Lastik Test Formu' : (canEdit ? 'Formu Düzenle' : 'Test Formu Detayı') }}</h1>
        <span v-if="!isNew" class="text-xs font-semibold px-2 py-1 rounded"
          :class="form.durum === 'SONLANDIRILDI' ? 'bg-slate-200 text-slate-700' : 'bg-green-100 text-green-700'">
          {{ form.durum === 'SONLANDIRILDI' ? 'Sonlandırıldı' : 'Aktif' }}
        </span>
      </div>

      <form @submit.prevent="submitForm" class="p-6 space-y-6">
        <!-- Üst Bilgiler -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Genel Bilgiler</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
              <input v-model="form.aciklama" :disabled="!canEdit" placeholder="Örn: 35 Ton Yarı Römork Sahra Testi"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Şirket</label>
              <input v-model="form.sirket" :disabled="!canEdit" list="dl-sirket"
                @input="onAutocompleteInput('sirket', 'sirket')" @focus="onAutocompleteFocus('sirket', 'sirket')"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
              <datalist id="dl-sirket"><option v-for="v in suggestions.sirket" :key="v" :value="v" /></datalist>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">İl</label>
              <input v-model="form.il" :disabled="!canEdit" list="dl-il" @input="filtreleIl" placeholder="Örn: Kırşehir"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
              <datalist id="dl-il"><option v-for="il in ilOnerileri" :key="il" :value="il" /></datalist>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">İletişim Numarası</label>
              <input v-model="form.iletisimNo" :disabled="!canEdit" placeholder="Örn: 0532 000 00 00"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
              <p class="text-[11px] text-slate-400 mt-0.5">Bu araç hakkında bilgi almak için aranabilecek numara.</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç Cinsi</label>
              <select v-model="form.aracCinsi" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100">
                <option value="">Seçin</option>
                <option v-for="opt in aracCinsiOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Plaka *</label>
              <input :value="form.plaka" @input="onPlakaInput" :disabled="!canEdit" required placeholder="Örn: 34 XYZ 567"
                class="w-full border rounded px-3 py-2 disabled:bg-slate-100 uppercase" :class="plakaHatasi ? 'border-red-400' : 'border-slate-300'" />
              <p class="text-[11px] mt-0.5" :class="plakaHatasi ? 'text-red-600' : 'text-slate-400'">
                {{ plakaHatasi || 'İl kodu (01-81) + boşluk + harf(ler) + boşluk + rakam(lar). Örn: 34 XYZ 567. Her plaka sadece bir kez kullanılabilir.' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç No</label>
              <input v-model="form.aracNo" :disabled="!canEdit" placeholder="Örn: ARC-0451" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Marka - Model</label>
              <input v-model="form.model" :disabled="!canEdit" list="dl-model" placeholder="Örn: Mercedes-Benz - Actros"
                @input="onAutocompleteInput('model', 'model')" @focus="onAutocompleteFocus('model', 'model')"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
              <datalist id="dl-model"><option v-for="v in suggestions.model" :key="v" :value="v" /></datalist>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Araç Tipi</label>
              <input v-model="form.aracTipi" :disabled="!canEdit" list="dl-arac-tipi"
                @input="onAutocompleteInput('aracTipi', 'arac_tipi')" @focus="onAutocompleteFocus('aracTipi', 'arac_tipi')"
                class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
              <datalist id="dl-arac-tipi"><option v-for="v in suggestions.aracTipi" :key="v" :value="v" /></datalist>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Hafta</label>
              <input v-model="form.hafta" :disabled="!canEdit" maxlength="4" inputmode="numeric" placeholder="Örn: 2226"
                class="w-full border rounded px-3 py-2 disabled:bg-slate-100"
                :class="haftaHatasi ? 'border-red-400' : 'border-slate-300'" />
              <p class="text-[11px] mt-0.5" :class="haftaHatasi ? 'text-red-600' : 'text-slate-400'">
                {{ haftaHatasi || '4 haneli: ilk 2 hane hafta (01-53), son 2 hane yıl. Örn: 2226 → 22. hafta, \'26.' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Yük Ağırlığı</label>
              <input v-model="form.yukAgirligi" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100" />
            </div>
          </div>
        </section>

        <!-- İlk Lastik Takılma Bilgileri: Ön / Çeker / Dorse ayrı ayrı -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">İlk Lastik Takılma Bilgileri</h2>
          <p class="text-xs text-slate-500 mb-2">Aracın ön, çeker ve dorse (varsa) grubundaki lastiklerin ilk takıldığı tarih ve o andaki kilometre. Ölçüm kısmındaki toplam km hesaplaması buradan yapılır.</p>
          <div class="grid sm:grid-cols-3 gap-3">
            <div class="border border-slate-200 rounded p-2">
              <p class="text-xs font-semibold text-slate-600 mb-1">Ön</p>
              <label class="block text-[10px] text-slate-500 mb-0.5">Takılma Tarihi</label>
              <input v-model="form.onTarih" :disabled="!canEdit" type="date" class="w-full border border-slate-300 rounded px-2 py-1 text-sm mb-1 disabled:bg-slate-100" />
              <label class="block text-[10px] text-slate-500 mb-0.5">Başlangıç KM</label>
              <input v-model="form.onKm" :disabled="!canEdit" placeholder="Örn: 1.230.628" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
            </div>
            <div class="border border-slate-200 rounded p-2">
              <p class="text-xs font-semibold text-slate-600 mb-1">Çeker</p>
              <label class="block text-[10px] text-slate-500 mb-0.5">Takılma Tarihi</label>
              <input v-model="form.cekerTarih" :disabled="!canEdit" type="date" class="w-full border border-slate-300 rounded px-2 py-1 text-sm mb-1 disabled:bg-slate-100" />
              <label class="block text-[10px] text-slate-500 mb-0.5">Başlangıç KM</label>
              <input v-model="form.cekerKm" :disabled="!canEdit" placeholder="Örn: 1.230.628" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
            </div>
            <div class="border border-slate-200 rounded p-2">
              <p class="text-xs font-semibold text-slate-600 mb-1">Dorse</p>
              <label class="block text-[10px] text-slate-500 mb-0.5">Takılma Tarihi</label>
              <input v-model="form.dorseTarih" :disabled="!canEdit" type="date" class="w-full border border-slate-300 rounded px-2 py-1 text-sm mb-1 disabled:bg-slate-100" />
              <label class="block text-[10px] text-slate-500 mb-0.5">Başlangıç KM</label>
              <input v-model="form.dorseKm" :disabled="!canEdit" placeholder="Örn: 1.230.628" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
            </div>
          </div>
        </section>

        <!-- Montaj Pozisyonu -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Montaj Pozisyonu</h2>
          <p v-if="!form.aracCinsi" class="text-xs text-amber-600 mb-2">Araç cinsi seçilmedi — tüm pozisyon kodları gösteriliyor.</p>
          <p class="text-xs text-slate-500 mb-2">Bir pozisyona tıklamak, aşağıdaki tabloya o pozisyon için otomatik bir satır ekler/kaldırır.</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-slate-500 mb-1">SOL</p>
              <div class="flex flex-wrap gap-2">
                <label v-for="kod in solKodlar" :key="kod"
                  class="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer"
                  :class="isSecili(kod) ? 'bg-petlas-navy text-white border-petlas-navy' : 'border-slate-300'">
                  <input type="checkbox" class="hidden" :disabled="!canEdit" :checked="isSecili(kod)" @change="toggleKod(kod)" />
                  {{ kod }}
                </label>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 mb-1">SAĞ</p>
              <div class="flex flex-wrap gap-2">
                <label v-for="kod in sagKodlar" :key="kod"
                  class="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer"
                  :class="isSecili(kod) ? 'bg-petlas-navy text-white border-petlas-navy' : 'border-slate-300'">
                  <input type="checkbox" class="hidden" :disabled="!canEdit" :checked="isSecili(kod)" @change="toggleKod(kod)" />
                  {{ kod }}
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Lastik Bilgileri -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Lastik Bilgileri (Pozisyon Bazlı)</h2>
            <button v-if="canEdit" type="button" @click="addManualItem" class="text-xs text-petlas-blue hover:underline">+ Ekstra Satır (manuel)</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-slate-500 border-b">
                  <th class="py-1 pr-2">Pozisyon</th>
                  <th class="py-1 pr-2">Lastik ID</th>
                  <th class="py-1 pr-2">Ebat</th>
                  <th class="py-1 pr-2">Desen</th>
                  <th class="py-1 pr-2">Hafta</th>
                  <th class="py-1 pr-2">Seri Numarası</th>
                  <th class="py-1 pr-2">Orj. Diş Derinliği</th>
                  <th v-if="canEdit"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in form.items" :key="i" class="border-b border-slate-100">
                  <td class="py-1 pr-2"><input v-model="item.pozisyon" :disabled="!canEdit" placeholder="S1" class="w-14 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.lastik_id" :disabled="!canEdit" class="w-32 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100 font-mono text-[11px]" /></td>
                  <td class="py-1 pr-2">
                    <input v-model="item.ebat" :disabled="!canEdit" :list="'dl-ebat-' + i" placeholder="385/65 R22.5"
                      @input="onItemAutoInput('ebat', item.ebat)" @focus="onItemAutoFocus('ebat')"
                      class="w-24 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" />
                    <datalist :id="'dl-ebat-' + i"><option v-for="v in itemSuggestions.ebat" :key="v" :value="v" /></datalist>
                  </td>
                  <td class="py-1 pr-2">
                    <input v-model="item.desen" :disabled="!canEdit" :list="'dl-desen-' + i" placeholder="NH200"
                      @input="onItemAutoInput('desen', item.desen)" @focus="onItemAutoFocus('desen')"
                      class="w-16 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" />
                    <datalist :id="'dl-desen-' + i"><option v-for="v in itemSuggestions.desen" :key="v" :value="v" /></datalist>
                  </td>
                  <td class="py-1 pr-2"><input v-model="item.hafta" :disabled="!canEdit" class="w-16 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.seri_numarasi" :disabled="!canEdit" class="w-24 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td class="py-1 pr-2"><input v-model="item.orjDisDerinligi" :disabled="!canEdit" placeholder="örn: 18" class="w-16 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" /></td>
                  <td v-if="canEdit" class="py-1"><button type="button" @click="removeItem(i)" class="text-petlas-red text-xs">Sil</button></td>
                </tr>
                <tr v-if="form.items.length === 0"><td colspan="8" class="text-slate-400 py-2">Yukarıdan pozisyon seçerek satır ekleyin.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Özellik -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Özellik</h2>
            <button v-if="canEdit" type="button" @click="addKarisim" class="text-xs text-petlas-blue hover:underline">+ Özellik Ekle</button>
          </div>
          <div v-for="(k, i) in form.karisimlar" :key="i" class="border border-slate-200 rounded p-3 mb-2">
            <div class="flex items-center justify-between gap-2 mb-2">
              <select v-model="k.karisimId" @change="onKarisimSecildi(k)" :disabled="!canEdit" class="flex-1 border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100">
                <option value="">Özellik seçin</option>
                <option v-for="opt in karisimListesi" :key="opt.id" :value="opt.id">{{ opt.ad }}</option>
              </select>
              <button v-if="canEdit" type="button" @click="form.karisimlar.splice(i,1)" class="text-petlas-red text-xs">Sil</button>
            </div>
            <p class="text-[11px] text-slate-500 mb-1">Hangi lastik(ler) için geçerli?</p>
            <div class="flex flex-wrap gap-2">
              <label v-for="item in form.items" :key="item.pozisyon" class="flex items-center gap-1 text-xs border rounded px-2 py-0.5 cursor-pointer"
                :class="k.pozisyonlar.includes(item.pozisyon) ? 'bg-petlas-navy text-white border-petlas-navy' : 'border-slate-300'">
                <input type="checkbox" class="hidden" :disabled="!canEdit" :checked="k.pozisyonlar.includes(item.pozisyon)" @change="toggleKarisimPozisyon(k, item.pozisyon)" />
                {{ item.pozisyon }}
              </label>
              <p v-if="form.items.length === 0" class="text-[11px] text-slate-400">Önce lastik pozisyonu ekleyin.</p>
            </div>
          </div>
          <p v-if="form.karisimlar.length === 0" class="text-slate-400 text-xs">Henüz özellik eklenmedi.</p>
          <p class="text-[11px] text-slate-400 mt-1">Listede olmayan bir özellik gerekiyorsa, <router-link to="/yonetim" class="text-petlas-blue hover:underline">Yönetim Paneli</router-link> sayfasından (yetkiniz varsa) ekleyebilirsiniz.</p>
        </section>

        <!-- Kontrol Çizelgesi (Ölçümler) -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Kontrol Çizelgesi (Ölçümler)</h2>
            <button v-if="canEdit" type="button" @click="addMeasurement" class="text-xs text-petlas-blue hover:underline">+ Ölçüm Ekle</button>
          </div>
          <p v-if="form.items.length === 0" class="text-xs text-amber-600 mb-2">Ölçüm ekleyebilmek için önce yukarıdan en az bir lastik satırı eklemelisiniz.</p>

          <div v-for="(m, i) in form.measurements" :key="i" class="border border-slate-200 rounded p-3 mb-3">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div class="flex items-end gap-3 flex-wrap">
                <div>
                  <label class="block text-[10px] text-slate-500 mb-0.5">Kaçıncı Ölçüm</label>
                  <input v-model.number="m.sira" :disabled="!canEdit" type="number" min="1" class="w-16 border rounded px-2 py-1 text-sm disabled:bg-slate-100"
                    :class="siraTekrarli(i) ? 'border-red-400' : 'border-slate-300'" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 mb-0.5">Kontrol Tarihi</label>
                  <input v-model="m.tarih" :disabled="!canEdit" type="date" class="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 mb-0.5">Ölçümü Yapan</label>
                  <input v-model="m.olcenKisi" :disabled="!canEdit" placeholder="Ad Soyad" class="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 mb-0.5">Ölçüm Durumu</label>
                  <select v-model="m.olcumDurumu" :disabled="!canEdit" class="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100">
                    <option value="SICAK">Sıcak</option>
                    <option value="SOGUK">Soğuk</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 mb-0.5">Aracın Mevcut KM'si</label>
                  <input v-model="m.aracKm" :disabled="!canEdit" placeholder="Örn: 1.360.793" class="w-32 border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
                </div>
              </div>
              <button v-if="canEdit" type="button" @click="form.measurements.splice(i,1)" class="text-petlas-red text-xs">Ölçümü Sil</button>
            </div>
            <p v-if="siraTekrarli(i)" class="text-[11px] text-red-600 mb-2">Bu ölçüm numarası ({{ m.sira }}) başka bir ölçümde de kullanılıyor — her ölçümün numarası benzersiz olmalı.</p>

            <div class="overflow-x-auto mb-2">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-left text-slate-500 border-b">
                    <th class="py-1 pr-2">Pozisyon</th>
                    <th class="py-1 pr-2">Toplam KM</th>
                    <th class="py-1 pr-1" colspan="4">Ölçülen Diş Derinliği (4 nokta)</th>
                    <th class="py-1 pl-6">Ölçülen PSI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(lo, j) in m.lastikOlcumleri" :key="j" class="border-b border-slate-100">
                    <td class="py-1 pr-2 font-medium">{{ lo.pozisyon }}</td>
                    <td class="py-1 pr-2 text-slate-500">{{ toplamKm(m, lo) }}</td>
                    <td v-for="n in 4" :key="n" class="py-1 pr-1">
                      <input :id="`dis-${i}-${j}-${n}`" v-model="lo.olculen_dis_derinlikleri[n-1]" :disabled="!canEdit"
                        @keydown.enter.prevent="onDisEnter(i, j, n)"
                        class="w-14 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" />
                    </td>
                    <td class="py-1 pl-6">
                      <input v-model="lo.olculen_psi" :disabled="!canEdit" class="w-16 border border-slate-300 rounded px-1 py-1 disabled:bg-slate-100" />
                    </td>
                  </tr>
                  <tr v-if="!m.lastikOlcumleri || m.lastikOlcumleri.length === 0"><td colspan="7" class="text-slate-400 py-2">Bu ölçüm için lastik satırı yok.</td></tr>
                </tbody>
              </table>
            </div>

            <div class="grid sm:grid-cols-3 gap-2">
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (F)</label><input v-model="m.onerilen_psi.f" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (D)</label><input v-model="m.onerilen_psi.d" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
              <div><label class="block text-xs text-slate-500 mb-0.5">Önerilen PSİ (T)</label><input v-model="m.onerilen_psi.t" :disabled="!canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" /></div>
            </div>
          </div>
          <p v-if="form.measurements.length === 0" class="text-slate-400 text-xs">Henüz ölçüm eklenmedi.</p>
        </section>

        <!-- AI Yorumu -->
        <section v-if="form.measurements.length > 0">
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">AI Yorumu</h2>
          <div class="bg-blue-50 border-l-4 border-petlas-blue rounded p-3">
            <p class="text-sm text-slate-700 whitespace-pre-line">{{ aiYorumu }}</p>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Bu yorum, girilen ölçüm verilerine göre otomatik (kural tabanlı) oluşturulur ve formdaki tüm lastikleri dikkate alır; teknik onayın yerine geçmez.</p>
        </section>

        <!-- Tablolaştır / Excel indir -->
        <section>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" @click="showTable = !showTable" class="bg-petlas-navy hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded transition-colors">
              {{ showTable ? 'Tabloyu Gizle' : 'Tablolaştır' }}
            </button>
            <button v-if="showTable" type="button" @click="downloadExcel" class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded transition-colors">
              ⬇ Excel Olarak İndir
            </button>
          </div>

          <div v-if="showTable" class="mt-3 overflow-x-auto">
            <table class="w-full text-xs border border-slate-200 border-collapse">
              <thead>
                <tr class="bg-petlas-navy text-white">
                  <th rowspan="2" class="text-left px-2 py-1 border border-slate-300 align-bottom">Pozisyon</th>
                  <th rowspan="2" class="text-left px-2 py-1 border border-slate-300 align-bottom">Ebat</th>
                  <th rowspan="2" class="text-left px-2 py-1 border border-slate-300 align-bottom">Desen</th>
                  <th rowspan="2" class="text-left px-2 py-1 border border-slate-300 align-bottom">Hafta</th>
                  <th rowspan="2" class="text-left px-2 py-1 border border-slate-300 align-bottom">Seri No</th>
                  <th v-for="m in siraliOlcumTablosu" :key="m.sira" colspan="5" class="text-center px-2 py-1 border border-slate-300">
                    {{ m.sira }}. Ölçüm{{ m.tarih ? ' — ' + m.tarih : '' }}
                    <div class="text-[10px] font-normal opacity-90">
                      {{ m.olcenKisi ? 'Ölçen: ' + m.olcenKisi : '' }}{{ m.olcenKisi && m.olcumDurumu ? ' · ' : '' }}{{ m.olcumDurumu === 'SICAK' ? 'Sıcak' : (m.olcumDurumu === 'SOGUK' ? 'Soğuk' : '') }}
                    </div>
                  </th>
                  <th v-if="siraliOlcumTablosu.length === 0" class="text-center px-2 py-1 border border-slate-300">Henüz ölçüm yok</th>
                </tr>
                <tr class="bg-slate-700 text-white">
                  <template v-for="m in siraliOlcumTablosu" :key="'alt-' + m.sira">
                    <th class="text-center px-1 py-1 border border-slate-300 font-normal">Diş 1</th>
                    <th class="text-center px-1 py-1 border border-slate-300 font-normal">Diş 2</th>
                    <th class="text-center px-1 py-1 border border-slate-300 font-normal">Diş 3</th>
                    <th class="text-center px-1 py-1 border border-slate-300 font-normal">Diş 4</th>
                    <th class="text-center px-1 py-1 border border-slate-300 font-normal">PSI</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in form.items" :key="item.pozisyon" class="border-b border-slate-100">
                  <td class="px-2 py-1 border border-slate-200 font-medium">{{ item.pozisyon }}</td>
                  <td class="px-2 py-1 border border-slate-200">{{ item.ebat || '—' }}</td>
                  <td class="px-2 py-1 border border-slate-200">{{ item.desen || '—' }}</td>
                  <td class="px-2 py-1 border border-slate-200">{{ item.hafta || '—' }}</td>
                  <td class="px-2 py-1 border border-slate-200">{{ item.seri_numarasi || '—' }}</td>
                  <template v-for="m in siraliOlcumTablosu" :key="item.pozisyon + '-' + m.sira">
                    <td v-for="n in 4" :key="n" class="px-1 py-1 border border-slate-200 text-center">
                      {{ lastikOlcumDegeri(m, item.pozisyon, 'dis', n) }}
                    </td>
                    <td class="px-1 py-1 border border-slate-200 text-center">{{ lastikOlcumDegeri(m, item.pozisyon, 'psi') }}</td>
                  </template>
                </tr>
                <tr v-if="form.items.length === 0"><td colspan="5" class="text-slate-400 py-2 px-2">Henüz lastik satırı eklenmedi.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Ek dosyalar -->
        <section>
          <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide mb-2 border-b border-slate-200 pb-1">Ek Dosyalar</h2>
          <MultiFileUpload v-if="canEdit" v-model="newFiles" :existing="existingAttachments" label="Kağıt Formun Fotoğrafları / PDF" />
          <div v-else-if="existingAttachments.length > 0" class="mb-3">
            <MultiFileUpload :model-value="[]" :existing="existingAttachments" :editable="false" />
          </div>
          <a v-if="existingAttachments.length === 0 && form.filePath" :href="form.filePath" target="_blank" class="inline-block text-sm text-petlas-blue hover:underline mb-3">Ek dosyayı görüntüle</a>
        </section>

        <!-- Notlar: tarihe özel, tablo halinde -->
        <section>
          <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 class="text-sm font-bold text-petlas-navy uppercase tracking-wide">Notlar</h2>
            <button v-if="canEdit" type="button" @click="addNot" class="text-xs text-petlas-blue hover:underline">+ Tarih Ekle</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-slate-500 border-b">
                  <th class="py-1 pr-2 w-36">Tarih</th>
                  <th class="py-1 pr-2">Not</th>
                  <th v-if="canEdit" class="w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(n, i) in form.notlarListesi" :key="i" class="border-b border-slate-100 align-top">
                  <td class="py-2 pr-2">
                    <input v-model="n.tarih" :disabled="!canEdit" type="date" class="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" />
                  </td>
                  <td class="py-2 pr-2">
                    <textarea v-if="n.tarih || !canEdit" v-model="n.icerik" :disabled="!canEdit" rows="2" placeholder="Bu tarihe ait not..."
                      class="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100"></textarea>
                    <p v-else class="text-[11px] text-slate-400 italic">Not girebilmek için önce tarih seçin.</p>
                  </td>
                  <td v-if="canEdit" class="py-2"><button type="button" @click="form.notlarListesi.splice(i,1)" class="text-petlas-red text-xs">Sil</button></td>
                </tr>
                <tr v-if="form.notlarListesi.length === 0"><td colspan="3" class="text-slate-400 py-2">Henüz not eklenmedi.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-600'">{{ message }}</p>

        <div v-if="canEdit" class="flex gap-2">
          <button type="submit" class="bg-petlas-red hover:bg-red-700 text-white font-semibold px-6 py-2 rounded transition-colors">
            {{ isNew ? 'Formu Kaydet' : 'Güncelle' }}
          </button>
          <button v-if="!isNew" type="button" @click="sonlandirToggle"
            class="text-sm px-3 py-2 rounded font-medium"
            :class="form.durum === 'SONLANDIRILDI' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'">
            {{ form.durum === 'SONLANDIRILDI' ? 'Yeniden Aktifleştir' : 'Testi Sonlandır' }}
          </button>
          <button v-if="!isNew" type="button" @click="deleteForm" class="text-petlas-red text-sm px-3 py-2">Sil</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'
import MultiFileUpload from '../components/MultiFileUpload.vue'
import { TURKIYE_ILLERI } from '../utils/iller'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isNew = computed(() => route.name === 'tire-test-new')
const canEdit = computed(() => auth.can('CREATE_TIRE_TESTS'))
const message = ref('')
const messageIsError = ref(false)
const showTable = ref(false)

// Kağıt formu taklit eden matris tablo için: ölçümler sıra numarasına göre sıralı listelenir.
const siraliOlcumTablosu = computed(() => [...form.measurements].sort((a, b) => (a.sira || 0) - (b.sira || 0)))

// Belirli bir ölçümde, belirli bir pozisyondaki lastiğin diş (n. nokta) ya da PSI değerini bulur.
function lastikOlcumDegeri(olcum, pozisyon, tur, n) {
  const lo = (olcum.lastikOlcumleri || []).find(x => x.pozisyon === pozisyon)
  if (!lo) return '—'
  if (tur === 'psi') return lo.olculen_psi || '—'
  return (lo.olculen_dis_derinlikleri && lo.olculen_dis_derinlikleri[n - 1]) || '—'
}
const newFiles = ref([])
const existingAttachments = ref([])
const karisimListesi = ref([])

const aracCinsiOptions = [
  'C - BİJLİ', 'TR - TRAKTÖR ÜNİTE', 'R - TREYLER', 'S - YARI TREYLER',
  'T - YARI MESAFE', 'İ - ŞEHİRLER ARASI OTOBÜS', 'U - ŞEHİR OTOBÜSÜ', 'F - FİLO OTOBÜSÜ', 'DİĞER'
]

// Araç cinsine göre uygun lastik pozisyon kodları. "DİĞER" seçiliyse tüm S1-S9 / D1-D9 kullanılabilir.
const positionsByType = {
  'C - BİJLİ': ['S1', 'S2', 'S3', 'S4', 'D1', 'D2', 'D3', 'D4'],
  'TR - TRAKTÖR ÜNİTE': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3'],
  'R - TREYLER': ['S1', 'S2', 'D1', 'D2'],
  'S - YARI TREYLER': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3'],
  'İ - ŞEHİRLER ARASI OTOBÜS': ['S1', 'S2', 'S3', 'S4', 'D1', 'D2', 'D3', 'D4'],
  'U - ŞEHİR OTOBÜSÜ': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3'],
  'F - FİLO OTOBÜSÜ': ['S1', 'S2', 'S3', 'D1', 'D2', 'D3']
}
const tumKodlar = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','D1','D2','D3','D4','D5','D6','D7','D8','D9']

const form = reactive({
  aciklama: '', sirket: '', il: '', iletisimNo: '', aracCinsi: '', plaka: '', aracNo: '', model: '', aracTipi: '', hafta: '', yukAgirligi: '',
  onTarih: '', onKm: '', cekerTarih: '', cekerKm: '', dorseTarih: '', dorseKm: '', durum: 'AKTIF',
  montajPozisyonu: [], items: [], karisimlar: [], measurements: [], filePath: '', notlarListesi: []
})

// --- İl otomatik tamamlama (81 il, statik liste, sunucuya gerek yok) ---
const ilOnerileri = ref([])
function filtreleIl() {
  const q = (form.il || '').toLocaleLowerCase('tr-TR')
  ilOnerileri.value = q ? TURKIYE_ILLERI.filter(il => il.toLocaleLowerCase('tr-TR').includes(q)) : TURKIYE_ILLERI
}

// --- Plaka: büyük harfe zorla + format doğrulama ---
const PLAKA_REGEX = /^(0[1-9]|[1-7][0-9]|8[01]) [A-ZİĞÜŞÖÇ]+ [0-9]+$/
function onPlakaInput(e) {
  form.plaka = e.target.value.toLocaleUpperCase('tr-TR')
}
const plakaHatasi = computed(() => {
  if (!form.plaka) return ''
  return PLAKA_REGEX.test(form.plaka) ? '' : 'Geçersiz format. Örnek: "34 XYZ 567" (il kodu 01-81, boşluk, harfler, boşluk, rakamlar).'
})

// --- Hafta formatı doğrulama: 4 hane, ilk 2 hane hafta (01-53), son 2 hane yıl (herhangi) ---
const HAFTA_REGEX = /^(0[1-9]|[1-4][0-9]|5[0-3])\d{2}$/
const haftaHatasi = computed(() => {
  if (!form.hafta) return ''
  return HAFTA_REGEX.test(form.hafta)
    ? ''
    : 'Geçersiz format. 4 haneli olmalı: ilk 2 hane hafta (01-53), son 2 hane yıl (örn: 2226).'
})

// --- Şirket / Model / Araç Tipi otomatik tamamlama ---
const suggestions = reactive({ sirket: [], model: [], aracTipi: [] })
let autocompleteTimer = null
function onAutocompleteInput(key, column) {
  clearTimeout(autocompleteTimer)
  autocompleteTimer = setTimeout(() => fetchSuggestions(key, column, form[key]), 200)
}
function onAutocompleteFocus(key, column) {
  if (!form[key]) fetchSuggestions(key, column, '')
}
async function fetchSuggestions(key, column, value) {
  try {
    const res = await api.get('/tire-tests/distinct-values', { params: { field: column, q: value } })
    suggestions[key] = res.data
  } catch { /* öneri yüklenemezse form yine de kullanılabilir */ }
}

// --- Lastik Bilgileri: Ebat / Desen otomatik tamamlama (tüm satırlar için ortak öneri kaynağı) ---
const itemSuggestions = reactive({ ebat: [], desen: [] })
let itemAutoTimer = null
function onItemAutoInput(field, value) {
  clearTimeout(itemAutoTimer)
  itemAutoTimer = setTimeout(() => fetchItemSuggestions(field, value || ''), 200)
}
function onItemAutoFocus(field) {
  fetchItemSuggestions(field, '')
}
async function fetchItemSuggestions(field, value) {
  try {
    const res = await api.get('/tire-tests/distinct-values', { params: { field, q: value } })
    itemSuggestions[field] = res.data
  } catch { /* öneri yüklenemezse form yine de kullanılabilir */ }
}
// Diş derinliği kutularında Enter'a basınca: 1→2→3→4 arası sırayla ilerler; 4.'ten sonra
// Enter, SIRADAKİ lastiğin 1. diş kutusuna atlar (PSI bu zincirin dışındadır, ayrı girilir).
function onDisEnter(measurementIndex, tireIndex, n) {
  let hedefId
  if (n < 4) {
    hedefId = `dis-${measurementIndex}-${tireIndex}-${n + 1}`
  } else {
    hedefId = `dis-${measurementIndex}-${tireIndex + 1}-1`
  }
  const hedefEl = document.getElementById(hedefId)
  if (hedefEl) hedefEl.focus()
}

const solKodlar = computed(() => {
  const pool = form.aracCinsi && positionsByType[form.aracCinsi] ? positionsByType[form.aracCinsi] : tumKodlar
  return pool.filter(k => k.startsWith('S'))
})
const sagKodlar = computed(() => {
  const pool = form.aracCinsi && positionsByType[form.aracCinsi] ? positionsByType[form.aracCinsi] : tumKodlar
  return pool.filter(k => k.startsWith('D'))
})

function isSecili(kod) {
  return form.montajPozisyonu.some(p => p.kod === kod && p.secili)
}

function generateLastikId(kod) {
  const base = (form.plaka || form.aciklama || `T${Date.now()}`).replace(/\s+/g, '')
  return `LST-${base}-${kod}`
}

function toggleKod(kod) {
  if (!canEdit.value) return
  const existing = form.montajPozisyonu.find(p => p.kod === kod)
  const yeniSecili = !(existing && existing.secili)
  if (existing) existing.secili = yeniSecili
  else form.montajPozisyonu.push({ kod, secili: true })

  if (yeniSecili) {
    if (!form.items.some(i => i.pozisyon === kod)) {
      form.items.push({ pozisyon: kod, lastik_id: generateLastikId(kod), ebat: '', desen: '', hafta: '', seri_numarasi: '', orjDisDerinligi: '' })
    }
  } else {
    const idx = form.items.findIndex(i => i.pozisyon === kod)
    if (idx !== -1) {
      const item = form.items[idx]
      if (item.ebat || item.seri_numarasi || item.desen) {
        if (!confirm(`${kod} pozisyonundaki satırda veri var, yine de kaldırılsın mı?`)) {
          const p = form.montajPozisyonu.find(x => x.kod === kod)
          if (p) p.secili = true
          return
        }
      }
      form.items.splice(idx, 1)
    }
  }
}

function addManualItem() {
  form.items.push({ pozisyon: '', lastik_id: generateLastikId('X'), ebat: '', desen: '', hafta: '', seri_numarasi: '', orjDisDerinligi: '' })
}
function removeItem(i) {
  const item = form.items[i]
  const p = form.montajPozisyonu.find(x => x.kod === item.pozisyon)
  if (p) p.secili = false
  form.items.splice(i, 1)
}

// --- Notlar: tarihe özel, en yeni tarih en üstte olacak şekilde eklenir ---
function addNot() {
  form.notlarListesi.unshift({ tarih: '', icerik: '' })
}

// --- Karışım ---
async function loadKarisimlar() {
  try {
    const res = await api.get('/karisimlar')
    karisimListesi.value = res.data
  } catch { /* saha müh. dışı kullanıcı için erişilemeyebilir, sorun değil */ }
}
function addKarisim() {
  form.karisimlar.push({ karisimId: '', ad: '', pozisyonlar: [] })
}
function onKarisimSecildi(k) {
  const secilen = karisimListesi.value.find(x => x.id === k.karisimId)
  k.ad = secilen ? secilen.ad : ''
}
function toggleKarisimPozisyon(k, pozisyon) {
  const idx = k.pozisyonlar.indexOf(pozisyon)
  if (idx === -1) k.pozisyonlar.push(pozisyon)
  else k.pozisyonlar.splice(idx, 1)
}

// --- Kilometre değerlerini ayrıştırma: "1.230.628" veya "1230628" ikisi de kabul edilir ---
function parseKm(val) {
  if (val === null || val === undefined || val === '') return null
  const temiz = String(val).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  const sayi = parseFloat(temiz)
  return isNaN(sayi) ? null : sayi
}

// Pozisyon kodunun numarasına göre hangi gruba (Ön/Çeker/Dorse) ait olduğunu tahmin eder.
// 1 numaralı pozisyonlar Ön, 2-3 Çeker, 4 ve üzeri Dorse/Avara kabul edilir.
function pozisyonGrubu(pozisyon) {
  const eslesme = String(pozisyon || '').match(/\d+/)
  const no = eslesme ? parseInt(eslesme[0], 10) : 1
  if (no <= 1) return 'ON'
  if (no <= 3) return 'CEKER'
  return 'DORSE'
}

// Bir lastiğin, bu ölçümdeki toplam kilometresini (metin olarak) gösterir:
// Toplam KM = Ölçümdeki araç kilometresi − o lastiğin grubunun başlangıç kilometresi.
function toplamKm(m, lo) {
  const sayi = toplamKmSayi(m, lo)
  return sayi === null ? '—' : sayi.toLocaleString('tr-TR')
}

// Bir lastiğin bu ölçümdeki 4 diş derinliği okumasının ortalamasını döner (metin).
function ortalamaDis(lo) {
  const degerler = (lo.olculen_dis_derinlikleri || []).map(v => {
    if (!v) return null
    const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/)
    return m ? parseFloat(m[0]) : null
  }).filter(v => v !== null)
  if (degerler.length === 0) return '—'
  return (degerler.reduce((a, b) => a + b, 0) / degerler.length).toFixed(1)
}

// Yeni ölçüm eklerken, o ana kadar kaydedilmiş tüm lastik satırları otomatik olarak listelenir.
function addMeasurement() {
  form.measurements.push({
    sira: form.measurements.length + 1,
    tarih: '',
    olcenKisi: auth.user?.username || '',
    olcumDurumu: 'SICAK',
    aracKm: '',
    onerilen_psi: { f: '', d: '', t: '' },
    lastikOlcumleri: form.items.map(it => ({
      pozisyon: it.pozisyon, lastik_id: it.lastik_id, olculen_psi: '', olculen_dis_derinlikleri: ['', '', '', '']
    }))
  })
}

function siraTekrarli(index) {
  const deger = form.measurements[index]?.sira
  if (deger === '' || deger === null || deger === undefined) return false
  return form.measurements.filter(m => m.sira === deger).length > 1
}

// --- AI Yorumu (kural tabanlı) — formdaki TÜM lastikleri dikkate alır ---
function parseNum(val) {
  if (!val) return null
  const m = String(val).replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}
// Bir lastiğin, verilen ölçümdeki toplam kilometresini SAYI olarak döner (grubuna göre).
function toplamKmSayi(m, lo) {
  const aracKm = parseKm(m.aracKm)
  if (aracKm === null) return null
  const grup = pozisyonGrubu(lo.pozisyon)
  const baslangic = grup === 'ON' ? parseKm(form.onKm) : grup === 'CEKER' ? parseKm(form.cekerKm) : parseKm(form.dorseKm)
  if (baslangic === null) return null
  return aracKm - baslangic
}
const aiYorumu = computed(() => {
  const olculumler = form.measurements.filter(m => m.tarih)
  if (olculumler.length === 0) return 'Henüz tarih girilmiş bir ölçüm bulunmuyor.'

  const siraliOlcumler = [...olculumler].sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
  const son = siraliOlcumler[siraliOlcumler.length - 1]

  // "İlk takılma" referansı: doldurulmuş olan Ön/Çeker/Dorse tarihlerinin en erkeni.
  const doldurulanTarihler = [form.onTarih, form.cekerTarih, form.dorseTarih].filter(Boolean)
  const ilkTakilma = doldurulanTarihler.length
    ? doldurulanTarihler.sort((a, b) => new Date(a) - new Date(b))[0]
    : siraliOlcumler[0].tarih

  const cumleler = []
  cumleler.push(`Toplam ${siraliOlcumler.length} ölçüm kaydı bulunuyor (ilk takılma: ${ilkTakilma || 'girilmedi'} → son ölçüm: ${son.tarih}).`)

  // Toplam KM: son ölçümdeki HER lastiğin kendi grubuna göre hesaplanan km'sinin ortalaması.
  const kmDegerleri = (son.lastikOlcumleri || []).map(lo => toplamKmSayi(son, lo)).filter(v => v !== null)
  const kmOrtalama = kmDegerleri.length ? kmDegerleri.reduce((a, b) => a + b, 0) / kmDegerleri.length : null
  if (kmOrtalama !== null) {
    cumleler.push(`İlk takılmadan bu yana lastikler ortalama yaklaşık ${Math.round(kmOrtalama).toLocaleString('tr-TR')} km yol yapmış.`)
  }

  // Diş derinliği: TÜM lastiklerin orijinal (ilk) değeri ile son ölçümdeki TÜM lastiklerin ortalaması.
  const disIlkDegerler = form.items.map(it => parseNum(it.orjDisDerinligi)).filter(v => v !== null)
  const disIlk = disIlkDegerler.length ? disIlkDegerler.reduce((a, b) => a + b, 0) / disIlkDegerler.length : null

  const disSonDegerler = (son.lastikOlcumleri || []).flatMap(lo => (lo.olculen_dis_derinlikleri || []).map(parseNum)).filter(v => v !== null)
  const disSon = disSonDegerler.length ? disSonDegerler.reduce((a, b) => a + b, 0) / disSonDegerler.length : null

  if (disIlk !== null && disSon !== null) {
    const fark = disIlk - disSon
    if (fark > 0) {
      cumleler.push(`Tüm lastiklerin ortalama diş derinliği ${disIlk.toFixed(1)} mm'den ${disSon.toFixed(1)} mm'ye düşmüş (${fark.toFixed(1)} mm aşınma).`)
      if (kmOrtalama && kmOrtalama > 0) {
        const oran = (fark / kmOrtalama) * 1000
        const durum = oran > 0.7 ? 'HIZLI aşınma (kontrol önerilir)' : oran > 0.4 ? 'normal aşınma aralığında' : 'düşük/yavaş aşınma'
        cumleler.push(`Yaklaşık ${oran.toFixed(2)} mm/1000km aşınma oranı — bu ${durum}.`)
      }
      if (disSon <= 3) cumleler.push('UYARI: Ortalama diş derinliği kritik seviyeye (≤3mm) yaklaşmış/ulaşmış, lastik değişimi değerlendirilmeli.')
    } else if (fark < 0) {
      cumleler.push('Diş derinliği ölçümünde artış görünüyor, veri girişini kontrol edin.')
    }
  }

  const sonPsiDegerler = (son.lastikOlcumleri || []).map(lo => parseNum(lo.olculen_psi)).filter(v => v !== null)
  if (sonPsiDegerler.length > 0) {
    const ortalama = sonPsiDegerler.reduce((a, b) => a + b, 0) / sonPsiDegerler.length
    const onerilenF = parseNum(son.onerilen_psi?.f)
    cumleler.push(`Son ölçümde tüm lastiklerin ortalama PSI'ı: ${ortalama.toFixed(1)}.`)
    if (onerilenF !== null) {
      const fark = ortalama - onerilenF
      if (Math.abs(fark) > 5) cumleler.push(`Önerilen PSİ değerinden (${onerilenF}) ${Math.abs(fark).toFixed(1)} birim ${fark > 0 ? 'yüksek' : 'düşük'} — basınç ayarı kontrol edilmeli.`)
      else cumleler.push('Ölçülen basınç, önerilen değere yakın seyrediyor.')
    }
  }

  return cumleler.join(' ')
})

// --- Excel export ---
function downloadExcel() {
  const ws = {}

  // --- 1) ÜST BÖLÜM: Genel Bilgiler ---
  const ozellikMetni = (form.karisimlar || [])
    .filter(k => k.ad)
    .map(k => `${k.ad}${k.pozisyonlar && k.pozisyonlar.length ? ' (' + k.pozisyonlar.join(', ') + ')' : ''}`)
    .join('; ') || '-'

  const genelBilgiler = [
    ['LASTİK TEST FORMU'],
    [],
    ['Açıklama', form.aciklama || '-'],
    ['Şirket', form.sirket || '-'],
    ['İl', form.il || '-'],
    ['İletişim Numarası', form.iletisimNo || '-'],
    ['Araç Cinsi', form.aracCinsi || '-'],
    ['Plaka', form.plaka || '-'],
    ['Araç No', form.aracNo || '-'],
    ['Model', form.model || '-'],
    ['Araç Tipi', form.aracTipi || '-'],
    ['Hafta', form.hafta || '-'],
    ['Yük Ağırlığı', form.yukAgirligi || '-'],
    ['Özellikler', ozellikMetni],
    ['Ön Takılma Tarihi', form.onTarih || '-', 'Ön Başlangıç KM', form.onKm || '-'],
    ['Çeker Takılma Tarihi', form.cekerTarih || '-', 'Çeker Başlangıç KM', form.cekerKm || '-'],
    ['Dorse Takılma Tarihi', form.dorseTarih || '-', 'Dorse Başlangıç KM', form.dorseKm || '-'],
    ['Durum', form.durum === 'SONLANDIRILDI' ? 'Sonlandırıldı' : 'Aktif'],
    []
  ]
  XLSX.utils.sheet_add_aoa(ws, genelBilgiler, { origin: { r: 0, c: 0 } })

  // --- 2) ORTA BÖLÜM: Ekrandaki "Tablolaştır" matrisinin birebir aynısı ---
  const matrisBaslangicSatiri = genelBilgiler.length + 1
  const olcumler = siraliOlcumTablosu.value
  const sabitSutunlar = ['Pozisyon', 'Ebat', 'Desen', 'Hafta', 'Seri No']

  const ustBaslik = [...sabitSutunlar]
  const altBaslik = ['', '', '', '', '']
  const merges = []

  olcumler.forEach((m, i) => {
    const durumMetni = m.olcumDurumu === 'SICAK' ? 'Sıcak' : (m.olcumDurumu === 'SOGUK' ? 'Soğuk' : '')
    const baslikMetni = `${m.sira}. Ölçüm${m.tarih ? ' — ' + m.tarih : ''}${m.olcenKisi ? ' (Ölçen: ' + m.olcenKisi + ')' : ''}${durumMetni ? ' [' + durumMetni + ']' : ''}`
    const baslangicSutun = sabitSutunlar.length + i * 5
    ustBaslik.push(baslikMetni, '', '', '', '')
    altBaslik.push('Diş 1', 'Diş 2', 'Diş 3', 'Diş 4', 'PSİ')
    merges.push({ s: { r: matrisBaslangicSatiri, c: baslangicSutun }, e: { r: matrisBaslangicSatiri, c: baslangicSutun + 4 } })
  })
  if (olcumler.length === 0) ustBaslik.push('Henüz ölçüm yok')

  const matrisSatirlari = [ustBaslik, altBaslik]
  form.items.forEach(item => {
    const satir = [item.pozisyon || '', item.ebat || '', item.desen || '', item.hafta || '', item.seri_numarasi || '']
    olcumler.forEach(m => {
      for (let n = 1; n <= 4; n++) satir.push(lastikOlcumDegeri(m, item.pozisyon, 'dis', n))
      satir.push(lastikOlcumDegeri(m, item.pozisyon, 'psi'))
    })
    matrisSatirlari.push(satir)
  })
  XLSX.utils.sheet_add_aoa(ws, matrisSatirlari, { origin: { r: matrisBaslangicSatiri, c: 0 } })

  // --- 3) SAĞ BÖLÜM: Notlar (bozulmadan, her not kendi satırında) ---
  const toplamMatrisSutunu = sabitSutunlar.length + Math.max(olcumler.length, 1) * 5
  const notlarBaslangicSutunu = toplamMatrisSutunu + 2
  const notlarBloku = [['Not Tarihi', 'Not İçeriği']]
  form.notlarListesi.filter(n => n.icerik).forEach(n => {
    notlarBloku.push([n.tarih || 'Tarihsiz', n.icerik])
  })
  if (notlarBloku.length === 1) notlarBloku.push(['-', 'Henüz not eklenmedi.'])
  XLSX.utils.sheet_add_aoa(ws, notlarBloku, { origin: { r: matrisBaslangicSatiri, c: notlarBaslangicSutunu } })

  ws['!merges'] = merges
  ws['!cols'] = Array.from({ length: notlarBaslangicSutunu + 2 }, () => ({ wch: 15 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Lastik Test Formu')

  const dosyaAdi = (form.plaka || form.aciklama || 'lastik-test-formu').replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ\- ]/g, '').slice(0, 60)
  XLSX.writeFile(wb, `${dosyaAdi}.xlsx`)
}

async function loadExisting() {
  const res = await api.get(`/tire-tests/${route.params.id}`)
  const d = res.data
  form.aciklama = d.aciklama
  form.sirket = d.sirket
  form.il = d.il || ''
  form.iletisimNo = d.iletisim_no || ''
  form.aracCinsi = d.arac_cinsi
  form.plaka = d.plaka
  form.aracNo = d.arac_no
  form.model = d.model
  form.aracTipi = d.arac_tipi
  form.hafta = d.hafta
  form.yukAgirligi = d.yuk_agirligi
  form.onTarih = d.on_tarih ? String(d.on_tarih).slice(0, 10) : (d.ilk_takilma_tarihi ? String(d.ilk_takilma_tarihi).slice(0, 10) : '')
  form.onKm = d.on_km || d.baslangic_km || ''
  form.cekerTarih = d.ceker_tarih ? String(d.ceker_tarih).slice(0, 10) : ''
  form.cekerKm = d.ceker_km || ''
  form.dorseTarih = d.dorse_tarih ? String(d.dorse_tarih).slice(0, 10) : ''
  form.dorseKm = d.dorse_km || ''
  form.montajPozisyonu = d.montaj_pozisyonu || []
  form.karisimlar = d.karisimlar || []

  form.items = (d.items || []).map(it => ({ ...it, hafta: it.hafta ?? it.hatta_kodu ?? '', orjDisDerinligi: it.orjDisDerinligi ?? '' }))

  form.measurements = (d.measurements || []).map((m, idx) => {
    if (Array.isArray(m.lastikOlcumleri) && m.lastikOlcumleri.some(lo => Array.isArray(lo.olculen_dis_derinlikleri))) {
      return {
        sira: m.sira ?? idx + 1, tarih: m.tarih || '', olcenKisi: m.olcenKisi || '',
        olcumDurumu: m.olcumDurumu || 'SICAK', aracKm: m.aracKm || '',
        onerilen_psi: m.onerilen_psi || { f: '', d: '', t: '' },
        lastikOlcumleri: m.lastikOlcumleri.map(lo => ({
          pozisyon: lo.pozisyon, lastik_id: lo.lastik_id, olculen_psi: lo.olculen_psi || '',
          olculen_dis_derinlikleri: lo.olculen_dis_derinlikleri || ['', '', '', '']
        }))
      }
    }
    const kaynakLastikler = form.items.length ? form.items : [{ pozisyon: 'GENEL', lastik_id: '' }]
    return {
      sira: idx + 1, tarih: m.tarih || '', olcenKisi: m.olcenKisi || '',
      olcumDurumu: m.olcumDurumu || (m.sicak ? 'SICAK' : 'SOGUK'), aracKm: m.km || '',
      onerilen_psi: m.onerilen_psi || { f: '', d: '', t: '' },
      lastikOlcumleri: kaynakLastikler.map(it => ({
        pozisyon: it.pozisyon, lastik_id: it.lastik_id,
        olculen_psi: Array.isArray(m.olculen_psi) ? (m.olculen_psi[0] || '') : (m.olculen_psi || ''),
        olculen_dis_derinlikleri: ['', '', '', '']
      }))
    }
  })

  form.filePath = d.file_path || ''
  form.durum = d.durum || 'AKTIF'

  // Notlar backend'de tek bir metin (TEXT) sütununda saklanıyor; yeni kayıtlar JSON dizi
  // olarak yazılır ([{tarih, icerik}]). Eski kayıtlarda düz metin olabilir, geriye dönük uyumluluk sağlanır.
  form.notlarListesi = []
  if (d.notlar) {
    try {
      const parsed = JSON.parse(d.notlar)
      if (Array.isArray(parsed)) form.notlarListesi = parsed
      else form.notlarListesi = [{ tarih: '', icerik: String(d.notlar) }]
    } catch {
      form.notlarListesi = [{ tarih: '', icerik: d.notlar }]
    }
  }

  existingAttachments.value = d.attachments || []
  filtreleIl()
}

async function submitForm() {
  message.value = ''
  if (haftaHatasi.value) {
    message.value = haftaHatasi.value
    messageIsError.value = true
    return
  }
  if (plakaHatasi.value) {
    message.value = plakaHatasi.value
    messageIsError.value = true
    return
  }
  const siralar = form.measurements.map(m => m.sira).filter(s => s !== '' && s !== null && s !== undefined)
  if (new Set(siralar).size !== siralar.length) {
    message.value = 'Bazı ölçümler aynı sıra numarasına sahip. Her ölçümün numarası benzersiz olmalı.'
    messageIsError.value = true
    return
  }
  try {
    const payload = { ...form, files: newFiles.value, notlar: JSON.stringify(form.notlarListesi) }
    delete payload.notlarListesi
    if (isNew.value) {
      const res = await api.post('/tire-tests', payload)
      message.value = 'Test formu kaydedildi.'
      messageIsError.value = false
      router.push(`/lastik-testleri/${res.data.id}`)
    } else {
      await api.put(`/tire-tests/${route.params.id}`, payload)
      message.value = 'Test formu güncellendi.'
      messageIsError.value = false
      newFiles.value = []
      loadExisting()
    }
  } catch (err) {
    message.value = err.response?.data?.error || 'Bir hata oluştu.'
    messageIsError.value = true
  }
}

async function sonlandirToggle() {
  const soru = form.durum === 'SONLANDIRILDI'
    ? 'Bu testi yeniden aktif hale getirmek istediğinize emin misiniz?'
    : 'Bu testi sonlandırmak istediğinize emin misiniz? Kayıt silinmez, sadece "şu an takılı" sayaçlarından düşer.'
  if (!confirm(soru)) return
  try {
    const res = await api.patch(`/tire-tests/${route.params.id}/sonlandir`)
    form.durum = res.data.durum
  } catch (err) {
    alert(err.response?.data?.error || 'İşlem başarısız.')
  }
}

async function deleteForm() {
  if (!confirm('Bu test formunu silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/tire-tests/${route.params.id}`)
    router.push('/lastik-testleri')
  } catch (err) {
    alert(err.response?.data?.error || 'Silme işlemi başarısız.')
  }
}

onMounted(() => {
  filtreleIl()
  loadKarisimlar()
  if (!isNew.value) loadExisting()
})
</script>
