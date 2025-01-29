<!-- src/components/CreateUser.vue -->
<template>
  <div class="container mt-5">
    <h2>Create User</h2>
    <form @submit.prevent="handleCreateUser">
      <!-- Username Input -->
      <div class="mb-3">
        <label for="username" class="form-label">New Username</label>
        <input
          type="text"
          class="form-control"
          id="username"
          v-model="username"
          required
        />
      </div>

      <!-- Password Input -->
      <div class="mb-3">
        <label for="password" class="form-label">New User Password</label>
        <input
          type="password"
          class="form-control"
          id="password"
          v-model="password"
          required
        />
      </div>

      <!-- Roles Section -->
      <div class="mb-3">
        <label class="form-label">Roles</label>
        <div
          v-for="(role, index) in roles"
          :key="index"
          class="input-group mb-2"
        >
          <!-- Role Type Select -->
          <select
            class="form-select"
            v-model="roles[index].role"
            required
          >
            <option disabled value="">Select a Role</option>
            <option v-for="roleOption in availableRoles" :key="roleOption.value" :value="roleOption.value">
              {{ roleOption.text }}
            </option>
          </select>

          <!-- Database Select -->
          <select
            class="form-select"
            v-model="roles[index].db"
            required
          >
            <option disabled value="">Select a Database</option>
            <option v-for="db in databases" :key="db" :value="db">
              {{ db }}
            </option>
          </select>

          <!-- Remove Role Button -->
          <button
            type="button"
            class="btn btn-danger"
            @click="removeRole(index)"
            :disabled="roles.length === 1"
          >
            Remove
          </button>
        </div>
        <button type="button" class="btn btn-secondary" @click="addRole">
          Add Role
        </button>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-success">Create User</button>

      <!-- Success Message -->
      <div v-if="message" class="alert alert-success mt-3">
        {{ message }}
      </div>

      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script>
import axios from '../utils/axiosConfig';

export default {
  name: 'CreateUser',
  data() {
    return {
      username: '',
      password: '',
      roles: [
        { role: '', db: '' }, // Initialize with one role
      ],
      availableRoles: [
        { value: 'readWrite', text: 'Read and Write' },
        { value: 'dbAdmin', text: 'Database Admin' },
        { value: 'userAdmin', text: 'User Admin' },
        // Add more roles as needed
      ],
      databases: [], // List of existing databases
      loadingDatabases: false,
      errorDatabases: null,
      message: null,
      error: null,
    };
  },
  methods: {
    // Fetch existing databases from the backend
    async fetchDatabases() {
      this.loadingDatabases = true;
      this.errorDatabases = null;
      try {
        const response = await axios.get('/admin/databases');
        this.databases = response.data.databases.map(db => db.name);
        console.log(this.databases);
      } catch (err) {
        console.error('Error fetching databases:', err);
        this.errorDatabases =
          err.response?.data?.message || 'Failed to load databases.';
      } finally {
        this.loadingDatabases = false;
      }
    },
    // Add a new role selection
    addRole() {
      this.roles.push({ role: '', db: '' });
    },
    // Remove a role selection
    removeRole(index) {
      if (this.roles.length > 1) {
        this.roles.splice(index, 1);
      }
    },
    // Handle form submission to create a new user
    async handleCreateUser() {
      this.message = null;
      this.error = null;

      // Validate that all roles are selected
      const rolesValid = this.roles.every(
        role => role.role !== '' && role.db !== ''
      );
      if (!rolesValid) {
        this.error = 'Please select a role and database for all entries.';
        return;
      }

      try {
        const payload = {
          username: this.username,
          password: this.password,
          roles: this.roles, // roles already contain role and db
        };
        const response = await axios.post('/admin/create-user', payload);
        this.message = response.data.message;
        // Reset form fields
        this.username = '';
        this.password = '';
        this.roles = [{ role: '', db: '' }];
      } catch (err) {
        console.error('Create User Error:', err);
        this.error =
          err.response?.data?.message ||
          (err.response?.data?.errors
            ? err.response.data.errors.map(e => e.msg).join(', ')
            : 'Failed to create user.');
      }
    },
  },
  mounted() {
    this.fetchDatabases();
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
