<!-- src/components/UserLogin.vue -->
<template>
    <div class="container mt-5">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="url" class="form-label">MongoDB URL</label>
          <input type="text" class="form-control" id="url" v-model="hostname" required />
        </div>
        <div class="mb-3">
          <label for="username" class="form-label">MongoDB Username</label>
          <input type="text" class="form-control" id="username" v-model="username" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">MongoDB Password</label>
          <input type="password" class="form-control" id="password" v-model="password" required />
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
      </form>
    </div>
  </template>
  
  <script>
  import { mapActions } from 'vuex';
  
  export default {
    name: 'UserLogin',
    data() {
      return {
        hostname: 'localhost:27017',
        username: '',
        password: '',
        error: null,
      };
    },
    methods: {
      ...mapActions(['login']),
      async handleLogin() {
        this.error = null;
        const credentials = {
          hostname: this.hostname,
          username: this.username,
          password: this.password,
        };
        const result = await this.login(credentials);
        if (result.success) {
          this.$router.push({ name: 'Dashboard' });
        } else {
          this.error = result.message;
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 500px;
  }
  </style>
  