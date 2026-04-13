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
          <p :class="['status', { past: isPast(reservation) }]">
            {{ isPast(reservation) ? '已结束' : '即将进行' }}
          </p>
        </div>
        <div class="reservation-actions">
          <button 
            v-if="!isPast(reservation)"
            class="btn btn-small btn-danger" 
            @click="cancelReservation(reservation)"
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
import type { Reservation } from '../types'

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

const isPast = (reservation: Reservation) => {
  const endTime = new Date(`${reservation.date}T${reservation.endTime}`)
  return endTime < new Date()
}

const cancelReservation = (reservation: Reservation) => {
  if (confirm(`确定要取消预定"${reservation.title}"吗？`)) {
    store.deleteReservation(reservation.id)
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
  background: #f0f9eb;
  color: #67c23a;
}

.reservation-info .status.past {
  background: #f4f4f5;
  color: #909399;
}

.reservation-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
</style>
