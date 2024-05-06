import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ExercisesPage.vue') }],
  },

  {
    path: '/exercises',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ExercisesPage.vue') }],
  },

  {
    path: '/flows',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/FlowsPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
