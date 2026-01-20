import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false },
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/questionarios',
        name: 'Questionnaires',
        component: () => import('@/views/QuestionnairesView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/organizacoes',
        name: 'Organizations',
        component: () => import('@/views/OrganizationsView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
        path: '/relatorios',
        name: 'Reports',
        component: () => import('@/views/ReportsView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
        path: '/',
        redirect: '/dashboard',
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router
