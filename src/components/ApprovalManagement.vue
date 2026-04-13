<template>
  <div class="approval-management">
    <div class="section-header">
      <h2>审批管理</h2>
    </div>

    <div v-if="pendingReservations.length === 0" class="empty-state">
      <p>暂无待审批的预定</p>
    </div>

    <div v-else class="approval-list">
      <div v-for="reservation in sortedPendingReservations" :key="reservation.id" class="approval-card">
        <div class="approval-info">
          <h3>{{ reservation.title }}</h3>
          <p class="user-name">
            <span class="label">申请人：</span>
            {{ getUserName(reservation.userId) }}
          </p>
          <p class="room-name">
            <span class="label">会议室：</span>
            {{ getRoomName(reservation.roomId) }}
          </p>
          <p class="time-info">
            <span class="label">时间：</span>
            <span class="date">{{ reservation.date }}</span>
            <span class="time">{{ reservation.startTime }} - {{ reservation.endTime }}</span>
          </p>
          <p class="created-at">
            <span class="label">申请时间：</span>
            {{ formatDateTime(reservation.createdAt) }}
          </p>
        </div>
        <div class="approval-actions">
          <button class="btn btn-success" @click="handleApprove(reservation)">
            通过
          </button>
          <button class="btn btn-danger" @click="handleReject(reservation)">
            驳回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../stores'
import { storeToRefs } from 'pinia'
import type { Reservation } from '../types'

const store = useStore()
const { users, rooms } = storeToRefs(store)

const pendingReservations = computed(() => {
  return store.getPendingReservations()
})

const sortedPendingReservations = computed(() => {
  return [...pendingReservations.value].sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return dateA.getTime() - dateB.getTime()
  })
})

const getUserName = (userId: string) => {
  return users.value.find(u => u.id === userId)?.name || '未知用户'
}

const getRoomName = (roomId: string) => {
  return rooms.value.find(r => r.id === roomId)?.name || '未知会议室'
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleApprove = (reservation: Reservation) => {
  if (confirm(`确定要通过"${reservation.title}"的预定申请吗？`)) {
    store.approveReservation(reservation.id)
  }
}

const handleReject = (reservation: Reservation) => {
  if (confirm(`确定要驳回"${reservation.title}"的预定申请吗？`)) {
    store.rejectReservation(reservation.id)
  }
}
</script>

<style scoped>
.approval-management {
  padding: 20px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.approval-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.approval-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e6a23c;
}

.approval-info h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 12px;
}

.approval-info p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.approval-info .label {
  color: #909399;
  min-width: 70px;
}

.approval-info .user-name {
  color: #409eff;
}

.approval-info .room-name {
  color: #67c23a;
}

.approval-info .time-info .time {
  margin-left: 8px;
}

.approval-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-success {
  background: #67c23a;
  color: white;
}

.btn-success:hover {
  background: #85ce61;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background: #f78989;
}
</style>
