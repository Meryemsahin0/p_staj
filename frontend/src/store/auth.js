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
    // Fiili yönetici: sabit ADMIN hesabı VEYA sonradan admin yetkisi verilmiş Personel/Stajyer
    isEffectiveAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi,
    // İçerik ekleyebilir mi: ADMIN/yetkili veya PERSONEL (Stajyer varsayılan olarak yalnızca görüntüler)
    canEditContent: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi || state.user?.role === 'PERSONEL',
    // Eski isim uyumluluğu için (bazı bileşenler bunu kullanıyor olabilir)
    isAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi,
    isManagerOrAdmin: (state) => state.user?.role === 'ADMIN' || !!state.user?.adminYetkisi || state.user?.role === 'PERSONEL'
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
