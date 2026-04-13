<template>
  <div class="my-reservations">
    <div class="section-header">
      <h2>我的预定</h2>
    </div>

    <div v-if="myReservations.length === 0" class="empty-state">
      <p>暂无预定记录</p>
    </div>

    <div v-else class="reservation-list">
      <div v-for="reservation in sortedReservations" :key="reservation.id" class="reservation-card">
        <div class="reservation-info">
          <h3>{{ reservation.title }}</h3>
          <p class="room-name">{{ getRoomName(reservation.roomId) }}</p>
          <p class="time-info">
            <span class="date">{{ reservation.date }}</span>
            <span class="time">{{ reservation.startTime }} - {{ reservation.endTime }}</span>
          </p>
          <p :class="['status', reservation.status]">
            {{ getStatusText(reservation.status) }}
          </p>
        </div>
        <div class="reservation-actions">
          <button 
            v-if="canCancel(reservation)"
            class="btn btn-small btn-danger" 
            @click="handleCancelReservation(reservation)"
          >
            取消预定
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
import type { Reservation, ReservationStatus } from '../types'

const store = useStore()
const { currentUser, rooms } = storeToRefs(store)

const myReservations = computed(() => {
  return store.getReservationsByUser(currentUser.value.id)
})

const sortedReservations = computed(() => {
  return [...myReservations.value].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`)
    const dateB = new Date(`${b.date}T${b.startTime}`)
    return dateB.getTime() - dateA.getTime()
  })
})

const getRoomName = (roomId: string) => {
  return rooms.value.find(r => r.id === roomId)?.name || '未知会议室'
}

const getStatusText = (status: ReservationStatus) => {
  const statusMap: Record<ReservationStatus, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已取消'
  }
  return statusMap[status]
}

const canCancel = (reservation: Reservation) => {
  if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
    return false
  }
  const endTime = new Date(`${reservation.date}T${reservation.endTime}`)
  return endTime > new Date()
}

const handleCancelReservation = (reservation: Reservation) => {
  if (confirm(`确定要取消预定"${reservation.title}"吗？`)) {
    store.cancelReservation(reservation.id)
  }
}
</script>

<style scoped>
.my-reservations {
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

.reservation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.reservation-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.reservation-info h3 {
  font-size: 16px;
  color: #303133;
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
  margin-bottom: 8px;
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

.reservation-info .status.approved {
  background: #f0f9eb;
  color: #67c23a;
}

.reservation-info .status.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.reservation-info .status.cancelled {
  background: #f4f4f5;
  color: #909399;
}

.reservation-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background: #f78989;
}
</style>
