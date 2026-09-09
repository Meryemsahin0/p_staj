import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', redirect: '/arama' },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/sifremi-unuttum', name: 'forgot-password', component: () => import('../views/ForgotPassword.vue') },
  { path: '/sifre-sifirla', name: 'reset-password', component: () => import('../views/ResetPassword.vue') },
  {
    path: '/arama', name: 'search', component: () => import('../views/Search.vue'),
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
    path: '/karisimlar', name: 'karisimlar', component: () => import('../views/KarisimYonetimi.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresPermission: 'CREATE_DOCUMENTS' }
  },
  {
    path: '/admin/kullanicilar', name: 'admin-users', component: () => import('../views/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/roller', name: 'admin-roles', component: () => import('../views/AdminRoles.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/hata-kodlari', name: 'admin-error-codes', component: () => import('../views/AdminErrorCodes.vue'),
    meta: { requiresAuth: true, requiresTeknikServisChief: true }
  },
  {
    path: '/admin/loglar', name: 'admin-logs', component: () => import('../views/AdminLogs.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
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
  if (to.meta.requiresAdmin && !auth.isEffectiveAdmin && !auth.isAnyChief) {
    return next('/arama')
  }
  if (to.meta.requiresTeknikServisChief && !auth.isEffectiveAdmin && !auth.isTeknikServisChief) {
    return next('/arama')
  }
  if (to.meta.requiresPermission && !auth.can(to.meta.requiresPermission)) {
    return next('/arama')
  }
  if ((to.name === 'login') && auth.isAuthenticated) {
    return next('/arama')
  }
  next()
})

export default router
