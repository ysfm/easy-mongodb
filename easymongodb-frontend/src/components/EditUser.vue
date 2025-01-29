<!-- src/components/EditUser.vue -->
<template>
  <div class="container mt-5">
    <div class="card">
      <div class="card-header">
        <h2>Change User Password</h2>


      </div>
      <div class="card-body">

        <div v-if="message" class="alert alert-success mt-3">
          {{ message }}
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger mt-3">
          {{ error }}
        </div>

        <form @submit.prevent="handleChangePassword">
          <div class="mb-3">
            <label for="newPassword" class="form-label">New Password</label>
            <input type="password" class="form-control" id="newPassword" v-model="newPassword" required />
          </div>
          <div class="mb-3">
            <label for="newPassword2" class="form-label">New Password (Confirm)</label>
            <input type="password" class="form-control" id="newPassword2" v-model="newPassword2" required />
          </div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>

    </div>

    <div class="card mt-4">
      <div class="card-header">
        <h2>Edit Roles</h2>
      </div>
      <div class="card-body">


        <div v-if="roles_message" class="alert alert-success mt-3">
          {{ roles_message }}
        </div>

        <!-- Error Message -->
        <div v-if="roles_error" class="alert alert-danger mt-3">
          {{ roles_error }}
        </div>

        <form @submit.prevent="handleEditRoles">

          <div class="mb-3">
            <label class="form-label">Roles</label>
            <div v-for="(role, index) in roles" :key="index" class="input-group mb-2">
              <!-- Role Type Select -->
              <select class="form-select" v-model="roles[index].role" required>
                <option disabled value="">Select a Role</option>
                <option v-for="roleOption in availableRoles" :key="roleOption.value" :value="roleOption.value">
                  {{ roleOption.text }}
                </option>
              </select>

              <!-- Database Select -->
              <select class="form-select" v-model="roles[index].db" required>
                <option disabled value="">Select a Database</option>
                <option v-for="db in databases" :key="db" :value="db">
                  {{ db }}
                </option>
              </select>

              <!-- Remove Role Button -->
              <button type="button" class="btn btn-danger" @click="removeRole(index)" :disabled="roles.length === 1">
                Remove
              </button>
            </div>
            <button type="button" class="btn btn-secondary" @click="addRole">
              Add Role
            </button>
          </div>
          <div class="mb-3">
            <button class="btn btn-primary" type="submit">Update Roles</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../utils/axiosConfig';

export default {
  name: 'EditUser',
  data() {
    return {
      username: '',
      newPassword: '',
      newPassword2: '',
      message: null,
      error: null,
      roles_message: null,
      roles_error: null,
      roles: [

      ],
      user: null,
      availableRoles: [
        { value: 'readWrite', text: 'Read and Write' },
        { value: 'dbAdmin', text: 'Database Admin' },
        { value: 'userAdmin', text: 'User Admin' },
        // Add more roles as needed
      ],
      databases: [], // List of existing databases
      loadingDatabases: false,
      errorUser: null,
      errorDatabases: null,
    };
  },
  methods: {
    async handleChangePassword() {
      this.message = null;
      this.error = null;

      if (this.newPassword !== this.newPassword2) {
        this.error = 'Passwords do not match.';
        return;
      }
      if (this.newPassword.length < 8) {
        this.error = 'Password must be at least 8 characters long.';
        return;
      }


      try {
        const payload = {
          username: this.user.user,
          newPassword: this.newPassword,
        };
        const response = await axios.post('/admin/change-password', payload);
        this.message = response.data.message;

      } catch (err) {
        console.error('Change Password Error:', err);
        this.error = err.response?.data?.message || 'Failed to change password.';
      }
    },
    async handleEditRoles() {
      this.roles_message = null;
      this.roles_error = null;
      try {
        const payload = {
          username: this.user.user,
          roles: this.roles,
        };
        const response = await axios.put('/admin/edit-roles', payload);
        this.roles_message = response.data.message;
      } catch (err) {
        console.error('Edit Roles Error:', err);
        this.roles_error = err.response?.data?.message || 'Failed to edit roles.';
      }
    },
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
    async fetchUser(user) {
      this.errorUser = null;
      try {
        const response = await axios.get('/admin/getUser/' + user);
        this.user = response.data.user;

        this.roles = response.data.user.roles;
        this.roles.forEach(roleObj => {
          const roleExists = this.availableRoles.some(
            availableRole => availableRole.value === roleObj.role
          );
          if (!roleExists) {
            this.availableRoles.push({
              value: roleObj.role,
              text: roleObj.role.charAt(0).toUpperCase() + roleObj.role.slice(1), // Capitalize for display
            });
          }
        });

      } catch (err) {
        console.error('Error fetching userdata:', err);
        this.errorUser =
          err.response?.data?.message || 'Failed to load userdata.';
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
  },
  async mounted() {
    const username = this.$route.params.username;
    await this.fetchDatabases();
    this.fetchUser(username);
  },
};
</script>

<style scoped>
.container {
  max-width: 500px;
}
</style>