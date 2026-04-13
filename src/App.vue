<template>
  <div class="app">
    <AppHeader />
    <main class="main-content">
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'calendar' }]"
          @click="activeTab = 'calendar'"
        >
          会议室预定
        </button>
        <button 
          v-if="isAdmin"
          :class="['tab', { active: activeTab === 'management' }]"
          @click="activeTab = 'management'"
        >
          会议室管理
        </button>
        <button 
          :class="['tab', { active: activeTab === 'myReservations' }]"
          @click="activeTab = 'myReservations'"
        >
          我的预定
        </button>
      </div>
      
      <div class="tab-content">
        <CalendarView v-if="activeTab === 'calendar'" />
        <RoomManagement v-else-if="activeTab === 'management'" />
        <MyReservations v-else-if="activeTab === 'myReservations'" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from './stores'
import { storeToRefs } from 'pinia'
import AppHeader from './components/AppHeader.vue'
import CalendarView from './components/CalendarView.vue'
import RoomManagement from './components/RoomManagement.vue'
import MyReservations from './components/MyReservations.vue'

const store = useStore()
const { isAdmin } = storeToRefs(store)
const activeTab = ref('calendar')
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: #f5f7fa;
}

.tabs {
  display: flex;
  gap: 0;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.tab {
  padding: 16px 24px;
  border: none;
  background: none;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  color: #409eff;
}

.tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.tab-content {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
