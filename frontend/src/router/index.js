import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
    },
    {
        path: '/questionarios',
        name: 'Questionnaires',
        component: () => import('@/views/QuestionnairesView.vue'),
    },
    {
        path: '/organizacoes',
        name: 'Organizations',
        component: () => import('@/views/OrganizationsView.vue'),
    },
    {
        path: '/relatorios',
        name: 'Reports',
        component: () => import('@/views/ReportsView.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// TODO: Quando implementar autenticação, adicionar navigation guards aqui
// router.beforeEach((to, from, next) => { ... });

export default router
