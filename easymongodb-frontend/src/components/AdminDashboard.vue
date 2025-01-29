<template>
  <div class="container mt-5">
    <h2>Admin Dashboard</h2>
    <button class="btn btn-danger float-end" @click="handleLogout">Logout</button>

    <div class="mt-4">
      <router-link to="/create-database" class="btn btn-primary me-2">Create Database</router-link>
      <router-link to="/create-user" class="btn btn-success me-2">Create User</router-link>
    </div>

    <div class="mt-4">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a 
            class="nav-link" 
            :class="{ active: activeTab === 'databases' }" 
            href="#" 
            @click.prevent="activeTab = 'databases'"
          >
            Databases
          </a>
        </li>
        <li class="nav-item">
          <a 
            class="nav-link" 
            :class="{ active: activeTab === 'users' }" 
            href="#" 
            @click.prevent="activeTab = 'users'"
          >
            Users
          </a>
        </li>
      </ul>

      <div class="tab-content mt-3">
        <div v-if="activeTab === 'databases'">
          <h3>Databases</h3>
          <table class="table table-striped mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Database Name</th>
                <th>Size on Disk</th>
                <th>Empty</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(db, index) in databases" :key="db.name">
                <td>{{ index + 1 }}</td>
                <td>{{ db.name }}</td>
                <td>{{ formatBytes(db.sizeOnDisk) }}</td>
                <td>{{ db.empty }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'users'">
          <h3>Users</h3>
          <table class="table table-striped mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Database</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in users" :key="user.user">
                <td>{{ index + 1 }}</td>
                <td>{{ user.user }}</td>
                <td>{{ user.db }}</td>
                <td>
                  <ul>
                    <li v-for="role in user.roles" :key="role.role">
                      {{ role.role }} ({{ role.db }})
                    </li>
                  </ul>
                </td>
                <td>
                  <button class="btn btn-warning btn-sm me-2" @click="editUser(user._id)">Edit User</button>
                  <button class="btn btn-danger btn-sm" @click="deleteUser(user.user)">Delete User</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../utils/axiosConfig';
import { mapActions } from 'vuex';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      activeTab: 'databases',
      databases: [],
      users: [],
      loadingDatabases: false,
      loadingUsers: false,
      errorDatabases: null,
      errorUsers: null,
    };
  },
  methods: {
    ...mapActions(['logout']),
    async handleLogout() {
      const result = await this.logout();
      if (result.success) {
        this.$router.push({ name: 'Login' });
      }
    },
    async fetchDatabases() {
      this.loadingDatabases = true;
      this.errorDatabases = null;
      try {
        const response = await axios.get('/admin/databases');
        this.databases = response.data.databases;
      } catch (error) {
        console.error('Error fetching databases:', error);
        this.errorDatabases = error.response?.data?.message || 'Failed to fetch databases.';
      } finally {
        this.loadingDatabases = false;
      }
    },
    async fetchUsers() {
      this.loadingUsers = true;
      this.errorUsers = null;
      try {
        const response = await axios.get('/admin/users');
        this.users = response.data.users;
      } catch (error) {
        console.error('Error fetching users:', error);
        this.errorUsers = error.response?.data?.message || 'Failed to fetch users.';
      } finally {
        this.loadingUsers = false;
      }
    },
    async deleteUser(username) {
      const confirmation = prompt(`Please confirm the username to delete: ${username}`);
      if (confirmation !== username) {
        alert('Username confirmation does not match.');
        return;
      }
      try {
        const response = await axios.post('/admin/delete-user', {  username  });
        alert(response.data.message);
        this.fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.message || 'Failed to delete user.');
      }
    },
    editUser(username) {
      this.$router.push({ name: 'EditUser', params: { username } });
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
  },
  mounted() {
    this.fetchDatabases();
    this.fetchUsers();
  },
};
</script>

<style scoped>
.float-end {
  margin-top: -40px;
}
.nav-link {
  cursor: pointer;
}
.nav-link.active {
  font-weight: bold;
  color: #0d6efd;
}
</style>
