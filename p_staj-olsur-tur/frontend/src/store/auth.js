import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('petlas_token') || null,
    refreshToken: localStorage.getItem('petlas_refresh_token') || null,
    user: JSON.parse(localStorage.getItem('petlas_user') || 'null')
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => (state.user ? state.user.role : null),
    department: (state) => state.user?.department || null,
    isChief: (state) => !!state.user?.isChief,
    canManageKarisim: (state) => state.user?.isEffectiveAdmin || (state.user?.isChief && state.user?.department === 'SAHA_MUHENDISLIGI') || !!state.user?.canManageKarisim,
    isSahaChief: (state) => state.user?.isChief && state.user?.department === 'SAHA_MUHENDISLIGI',
    isTeknikServisChief: (state) => state.user?.isChief && state.user?.department === 'TEKNIK_SERVIS',
    isAnyChief: (state) => !!state.user?.isChief,
    // Fiili yönetici: sabit ADMIN hesabı VEYA sonradan admin yetkisi verilmiş herhangi bir rol
    isEffectiveAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi,
    // Esnek izin kontrolü: Roller & Yetkiler panelinden role atanan izinler (permissions dizisi
    // login sırasında backend'den gelir). Admin her zaman tüm izinlere sahiptir. Bazı izinler
    // ayrıca departman ile de sınırlıdır (ör. CREATE_TIRE_TESTS sadece Saha Mühendisliği'nde geçerli).
    can: (state) => (permKey) => {
      if (state.user?.role === 'ADMIN' || state.user?.adminYetkisi) return true
      const PERM_DEPARTMENT_MAP = {
        VIEW_TIRE_TESTS: 'SAHA_MUHENDISLIGI', CREATE_TIRE_TESTS: 'SAHA_MUHENDISLIGI',
        VIEW_KABUL_RET: 'TEKNIK_SERVIS', CREATE_KABUL_RET: 'TEKNIK_SERVIS'
      }
      const gerekliDepartman = PERM_DEPARTMENT_MAP[permKey]
      if (gerekliDepartman && state.user?.department !== gerekliDepartman) return false
      return Array.isArray(state.user?.permissions) && state.user.permissions.includes(permKey)
    },
    // Eski isim uyumluluğu için (bazı bileşenler bunu kullanıyor olabilir) - herhangi bir içerik
    // ekleme izni varsa true döner (belge, saha testi veya kabul/ret).
    canEditContent: (state) => {
      if (state.user?.role === 'ADMIN' || state.user?.adminYetkisi) return true
      const perms = state.user?.permissions || []
      return perms.includes('CREATE_DOCUMENTS') || perms.includes('CREATE_TIRE_TESTS') || perms.includes('CREATE_KABUL_RET')
    },
    isAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi,
    isManagerOrAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi || (state.user?.permissions || []).includes('CREATE_TIRE_TESTS')
  },
  actions: {
    setSession({ token, refreshToken, user }) {
      this.token = token
      this.refreshToken = refreshToken
      this.user = user
      localStorage.setItem('petlas_token', token)
      localStorage.setItem('petlas_refresh_token', refreshToken || '')
      localStorage.setItem('petlas_user', JSON.stringify(user))
    },
    logout() {
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('petlas_token')
      localStorage.removeItem('petlas_refresh_token')
      localStorage.removeItem('petlas_user')
    }
  }
})
