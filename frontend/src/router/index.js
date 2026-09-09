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
    path: '/lastik-testleri', name: 'tire-tests', component: () => import('../views/TireTests.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lastik-testleri/yeni', name: 'tire-test-new', component: () => import('../views/TireTestForm.vue'),
    meta: { requiresAuth: true, requiresEditor: true }
  },
  {
    path: '/lastik-testleri/:id', name: 'tire-test-detail', component: () => import('../views/TireTestForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresEditor: true }
  },
  {
    path: '/admin/kullanicilar', name: 'admin-users', component: () => import('../views/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
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
  if (to.meta.requiresAdmin && !auth.isEffectiveAdmin) {
    return next('/arama')
  }
  if (to.meta.requiresEditor && !auth.canEditContent) {
    return next('/arama')
  }
  if ((to.name === 'login') && auth.isAuthenticated) {
    return next('/arama')
  }
  next()
})

export default router
