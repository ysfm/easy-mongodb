// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';
import UserLogin from '../components/UserLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import CreateDatabase from '../components/CreateDatabase.vue';
import CreateUser from '../components/CreateUser.vue';
import EditUser from '../components/EditUser.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: UserLogin,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/create-database',
    name: 'CreateDatabase',
    component: CreateDatabase,
    meta: { requiresAuth: true },
  },
  {
    path: '/create-user',
    name: 'CreateUser',
    component: CreateUser,
    meta: { requiresAuth: true },
  },
  {
    path: '/edit-user/:username',
    name: 'EditUser',
    component: EditUser,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation Guard to protect routes
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = store.getters.isAuthenticated;
  
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
