<!-- src/components/CreateDatabase.vue -->
<template>
    <div class="container mt-5">
      <h2>Create Database</h2>
      <form @submit.prevent="handleCreateDatabase">
        <div class="mb-3">
          <label for="dbName" class="form-label">Database Name</label>
          <input type="text" class="form-control" id="dbName" v-model="dbName" required />
        </div>
        <button type="submit" class="btn btn-primary">Create Database</button>
        <div v-if="message" class="alert alert-success mt-3">{{ message }}</div>
        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
      </form>
    </div>
  </template>
  
  <script>
  import axios from '../utils/axiosConfig';
  
  export default {
    name: 'CreateDatabase',
    data() {
      return {
        dbName: '',
        message: null,
        error: null,
      };
    },
    methods: {

      async handleCreateDatabase() {
        this.message = null;
        this.error = null;
        try {
          const payload = {
            dbName: this.dbName,
          };
          const response = await axios.post('/admin/create-database', payload);
          this.message = response.data.message;
          this.dbName = '';
          this.username = '';
          this.roles = [{ role: 'readWrite', db: '' }];
        } catch (err) {
          console.error('Create Database Error:', err);
          this.error = err.response?.data?.message || 'Failed to create database.';
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 600px;
  }
  </style>
  