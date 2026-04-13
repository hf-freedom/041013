<template>
  <div class="approval-management">
    <div class="section-header">
      <h2>审批管理</h2>
      <span class="badge" v-if="pendingReservations.length > 0">待审批: {{ pendingReservations.length }}</span>
    </div>

    <div v-if="pendingReservations.length === 0" class="empty-state">
      <p>暂无待审批的预定</p>
    </div>

    <div v-else class="reservation-list">
      <div v-for="reservation in sortedReservations" :key="reservation.id" class="reservation-card">
        <div class="reservation-info">
          <h3>{{ reservation.title }}</h3>
          <p class="applicant">申请人：{{ getUserName(reservation.userId) }}</p>
          <p class="room-name">{{ getRoomName(reservation.roomId) }}</p>
          <p class="time-info">
            <span class="date">{{ reservation.date }}</span>
            <span class="time">{{ reservation.startTime }} - {{ reservation.endTime }}</span>
          </p>
          <p class="status pending">待审批</p>
        </div>
        <div class="reservation-actions">
          <button class="btn btn-small btn-success" @click="approve(reservation)">
            通过
          </button>
          <button class="btn btn-small btn-danger" @click="reject(reservation)">
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
const { pendingReservations, users, rooms } = storeToRefs(store)

const sortedReservations = computed(() => {
  return [...pendingReservations.value].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`)
    const dateB = new Date(`${b.date}T${b.startTime}`)
    return dateA.getTime() - dateB.getTime()
  })
})

const getUserName = (userId: string) => {
  return users.value.find(u => u.id === userId)?.name || '未知用户'
}

const getRoomName = (roomId: string) => {
  return rooms.value.find(r => r.id === roomId)?.name || '未知会议室'
}

const approve = (reservation: Reservation) => {
  if (store.checkTimeConflict(reservation.roomId, reservation.date, reservation.startTime, reservation.endTime, reservation.id)) {
    alert('该时间段已有已通过的预定，无法通过审批')
    return
  }
  store.updateReservationStatus(reservation.id, 'approved')
  alert('已通过审批')
}

const reject = (reservation: Reservation) => {
  if (confirm(`确定要驳回"${reservation.title}"的预定吗？`)) {
    store.updateReservationStatus(reservation.id, 'rejected')
    alert('已驳回审批')
  }
}
</script>

<style scoped>
.approval-management {
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  color: #303133;
}

.badge {
  background: #f56c6c;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.reservation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.reservation-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e6a23c;
}

.reservation-info h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.reservation-info .applicant {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.reservation-info .room-name {
  color: #409eff;
  font-size: 14px;
  margin-bottom: 8px;
}

.reservation-info .time-info {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.reservation-info .status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.reservation-info .status.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.reservation-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
</style>
