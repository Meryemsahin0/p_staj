import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', redirect: '/anasayfa' },
  { path: '/arama', redirect: '/anasayfa' }, // eski adres, geriye dönük uyumluluk
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/sifremi-unuttum', name: 'forgot-password', component: () => import('../views/ForgotPassword.vue') },
  { path: '/sifre-sifirla', name: 'reset-password', component: () => import('../views/ResetPassword.vue') },
  {
    path: '/anasayfa', name: 'search', component: () => import('../views/Search.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/gundem', name: 'haberler', component: () => import('../views/Haberler.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/gundem/:id', name: 'haber-detay', component: () => import('../views/HaberDetay.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dokuman/:id', name: 'document-detail', component: () => import('../views/DocumentDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lastik-testleri', name: 'tire-tests', component: () => import('../views/TireTests.vue'),
    meta: { requiresAuth: true, requiresPermission: 'VIEW_TIRE_TESTS' }
  },
  {
    path: '/lastik-testleri/yeni', name: 'tire-test-new', component: () => import('../views/TireTestForm.vue'),
    meta: { requiresAuth: true, requiresPermission: 'CREATE_TIRE_TESTS' }
  },
  {
    path: '/lastik-testleri/:id', name: 'tire-test-detail', component: () => import('../views/TireTestForm.vue'),
    meta: { requiresAuth: true, requiresPermission: 'VIEW_TIRE_TESTS' }
  },
  {
    path: '/kabul-ret', name: 'kabul-ret', component: () => import('../views/KabulRet.vue'),
    meta: { requiresAuth: true, requiresPermission: 'VIEW_KABUL_RET' }
  },
  {
    path: '/kabul-ret/yeni', name: 'kabul-ret-new', component: () => import('../views/KabulRetForm.vue'),
    meta: { requiresAuth: true, requiresPermission: 'CREATE_KABUL_RET' }
  },
  {
    path: '/kabul-ret/:id', name: 'kabul-ret-detail', component: () => import('../views/KabulRetForm.vue'),
    meta: { requiresAuth: true, requiresPermission: 'VIEW_KABUL_RET' }
  },
  {
    path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresPermission: 'CREATE_DOCUMENTS' }
  },
  // Tüm yönetim sayfaları (Kullanıcılar, Roller, Hata Kodları, Özellikler, Loglar, Haberler)
  // artık tek bir sekmeli sayfada birleşti. Eski adresler buraya yönlendirilir.
  {
    path: '/yonetim', name: 'yonetim-paneli', component: () => import('../views/YonetimPaneli.vue'),
    meta: { requiresAuth: true, requiresYonetimErisim: true }
  },
  { path: '/karisimlar', redirect: '/yonetim' },
  { path: '/admin/kullanicilar', redirect: '/yonetim' },
  { path: '/admin/roller', redirect: '/yonetim' },
  { path: '/admin/hata-kodlari', redirect: '/yonetim' },
  { path: '/admin/loglar', redirect: '/yonetim' },
  {
    path: '/profil', name: 'profile', component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }
  if (to.meta.requiresYonetimErisim && !auth.isEffectiveAdmin && !auth.isAnyChief && !auth.canManageKarisim) {
    return next('/anasayfa')
  }
  if (to.meta.requiresPermission && !auth.can(to.meta.requiresPermission)) {
    return next('/anasayfa')
  }
  if ((to.name === 'login') && auth.isAuthenticated) {
    return next('/anasayfa')
  }
  next()
})

export default router
