<template>
  <div class="calendar-view">
    <div class="section-header">
      <h2>会议室预定</h2>
    </div>

    <div class="controls">
      <div class="control-group">
        <label>选择会议室：</label>
        <select v-model="selectedRoomId">
          <option v-for="room in availableRooms" :key="room.id" :value="room.id">
            {{ room.name }} ({{ room.location }})
          </option>
        </select>
      </div>
      <div class="control-group">
        <label>选择日期：</label>
        <input type="date" v-model="selectedDate" :min="minDate" />
      </div>
    </div>

    <div v-if="currentRoom" class="calendar-container">
      <div class="room-info-bar">
        <span class="room-name">{{ currentRoom.name }}</span>
        <span class="room-time">开放时间：{{ currentRoom.openTimeStart }} - {{ currentRoom.openTimeEnd }}</span>
      </div>

      <div class="time-grid">
        <div class="time-labels">
          <div v-for="hour in hours" :key="hour" class="time-label">
            {{ hour.toString().padStart(2, '0') }}:00
          </div>
        </div>
        <div class="time-slots">
          <div
            v-for="slot in timeSlots"
            :key="slot.time"
            :class="['time-slot', { 
              disabled: slot.disabled, 
              reserved: slot.reservation,
              'my-reservation': slot.reservation?.userId === currentUser.id,
              'pending': slot.reservation?.status === 'pending'
            }]"
            @click="handleSlotClick(slot)"
          >
            <span v-if="slot.reservation" class="reservation-info">
              <span class="reservation-title">{{ slot.reservation.title }}</span>
              <span class="reservation-user">{{ getUserName(slot.reservation.userId) }}</span>
              <span :class="['reservation-status', slot.reservation.status]">
                {{ getStatusText(slot.reservation.status) }}
              </span>
            </span>
            <span v-else-if="!slot.disabled" class="slot-time">{{ slot.time }}</span>
          </div>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-color available"></span>
          <span>可预定</span>
        </div>
        <div class="legend-item">
          <span class="legend-color reserved"></span>
          <span>已被预定</span>
        </div>
        <div class="legend-item">
          <span class="legend-color my-reservation"></span>
          <span>我的预定</span>
        </div>
        <div class="legend-item">
          <span class="legend-color pending"></span>
          <span>待审批</span>
        </div>
        <div class="legend-item">
          <span class="legend-color disabled"></span>
          <span>非开放时间</span>
        </div>
      </div>
    </div>

    <div v-if="showReserveModal" class="modal-overlay" @click.self="closeReserveModal">
      <div class="modal">
        <div class="modal-header">
          <h3>预定会议室</h3>
          <button class="modal-close" @click="closeReserveModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>会议主题</label>
            <input v-model="reserveForm.title" type="text" placeholder="请输入会议主题" />
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <select v-model="reserveForm.startTime">
              <option v-for="time in availableStartTimes" :key="time" :value="time">
                {{ time }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <select v-model="reserveForm.endTime">
              <option v-for="time in availableEndTimes" :key="time" :value="time">
                {{ time }}
              </option>
            </select>
          </div>
          <div v-if="isAdmin" class="admin-notice">
            <span class="notice-icon">ℹ️</span>
            <span>管理员预定将直接通过，无需审批</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeReserveModal">取消</button>
          <button class="btn btn-primary" @click="confirmReserve">确认预定</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal" style="min-width: 350px">
        <div class="modal-header">
          <h3>预定详情</h3>
          <button class="modal-close" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <span class="detail-label">会议主题：</span>
            <span>{{ selectedReservation?.title }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预定人：</span>
            <span>{{ getUserName(selectedReservation?.userId || '') }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">时间：</span>
            <span>{{ selectedReservation?.startTime }} - {{ selectedReservation?.endTime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态：</span>
            <span :class="['status-badge', selectedReservation?.status]">
              {{ getStatusText(selectedReservation?.status || 'pending') }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showDetailModal = false">关闭</button>
          <button 
            v-if="canCancelReservation"
            class="btn btn-danger" 
            @click="cancelReservation"
          >
            取消预定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStore } from '../stores'
import { storeToRefs } from 'pinia'
import type { Reservation, ReservationStatus } from '../types'

const store = useStore()
const { availableRooms, currentUser, users, isAdmin } = storeToRefs(store)

const selectedRoomId = ref('')
const selectedDate = ref(formatDate(new Date()))
const showReserveModal = ref(false)
const showDetailModal = ref(false)
const selectedReservation = ref<Reservation | null>(null)
const clickStartTime = ref('')

const reserveForm = ref({
  title: '',
  startTime: '',
  endTime: '',
})

const minDate = formatDate(new Date())

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

watch(availableRooms, (rooms) => {
  if (rooms.length > 0 && !selectedRoomId.value) {
    selectedRoomId.value = rooms[0].id
  }
}, { immediate: true })

const currentRoom = computed(() => {
  return availableRooms.value.find(r => r.id === selectedRoomId.value)
})

const hours = computed(() => {
  if (!currentRoom.value) return []
  const start = parseInt(currentRoom.value.openTimeStart.split(':')[0])
  const end = parseInt(currentRoom.value.openTimeEnd.split(':')[0])
  return Array.from({ length: end - start }, (_, i) => start + i)
})

const timeSlots = computed(() => {
  if (!currentRoom.value) return []
  
  const slots: { time: string; disabled: boolean; reservation: Reservation | null }[] = []
  const [startHour, startMin] = currentRoom.value.openTimeStart.split(':').map(Number)
  const [endHour, endMin] = currentRoom.value.openTimeEnd.split(':').map(Number)
  
  const reservations = store.getApprovedReservationsByRoomAndDate(selectedRoomId.value, selectedDate.value)
  
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === endHour - 1 && m >= endMin) break
      if (h === startHour && m < startMin) continue
      
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      
      const reservation = reservations.find(r => {
        return time >= r.startTime && time < r.endTime
      })
      
      slots.push({
        time,
        disabled: false,
        reservation: reservation || null,
      })
    }
  }
  
  return slots
})

const availableStartTimes = computed(() => {
  if (!currentRoom.value) return []
  const times: string[] = []
  const [startHour] = currentRoom.value.openTimeStart.split(':').map(Number)
  const [endHour, endMin] = currentRoom.value.openTimeEnd.split(':').map(Number)
  
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === endHour - 1 && m >= endMin - 30) break
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      if (!store.checkTimeConflict(selectedRoomId.value, selectedDate.value, time, time)) {
        times.push(time)
      }
    }
  }
  return times
})

const availableEndTimes = computed(() => {
  if (!currentRoom.value || !reserveForm.value.startTime) return []
  const times: string[] = []
  const [startH, startM] = reserveForm.value.startTime.split(':').map(Number)
  const [endHour, endMin] = currentRoom.value.openTimeEnd.split(':').map(Number)
  
  for (let h = startH; h <= endHour; h++) {
    const startMForHour = h === startH ? startM + 30 : 0
    for (let m = startMForHour; m < 60; m += 30) {
      if (h === endHour && m > endMin) break
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      times.push(time)
    }
  }
  return times
})

const getUserName = (userId: string) => {
  return users.value.find(u => u.id === userId)?.name || '未知用户'
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

const canCancelReservation = computed(() => {
  if (!selectedReservation.value) return false
  if (selectedReservation.value.status === 'cancelled' || selectedReservation.value.status === 'rejected') {
    return false
  }
  return selectedReservation.value.userId === currentUser.value.id
})

const handleSlotClick = (slot: { time: string; disabled: boolean; reservation: Reservation | null }) => {
  if (slot.disabled) return
  
  if (slot.reservation) {
    selectedReservation.value = slot.reservation
    showDetailModal.value = true
  } else {
    clickStartTime.value = slot.time
    reserveForm.value = {
      title: '',
      startTime: slot.time,
      endTime: '',
    }
    showReserveModal.value = true
  }
}

const closeReserveModal = () => {
  showReserveModal.value = false
  reserveForm.value = { title: '', startTime: '', endTime: '' }
}

const confirmReserve = () => {
  if (!reserveForm.value.title.trim()) {
    alert('请输入会议主题')
    return
  }
  if (!reserveForm.value.startTime || !reserveForm.value.endTime) {
    alert('请选择时间')
    return
  }
  if (reserveForm.value.endTime <= reserveForm.value.startTime) {
    alert('结束时间必须晚于开始时间')
    return
  }
  
  if (store.checkTimeConflict(selectedRoomId.value, selectedDate.value, reserveForm.value.startTime, reserveForm.value.endTime)) {
    alert('该时间段已被预定')
    return
  }
  
  store.addReservation({
    roomId: selectedRoomId.value,
    userId: currentUser.value.id,
    date: selectedDate.value,
    startTime: reserveForm.value.startTime,
    endTime: reserveForm.value.endTime,
    title: reserveForm.value.title,
  }, isAdmin.value)
  
  closeReserveModal()
  if (isAdmin.value) {
    alert('预定成功！')
  } else {
    alert('预定申请已提交，请等待审批！')
  }
}

const cancelReservation = () => {
  if (selectedReservation.value) {
    if (confirm(`确定要取消预定"${selectedReservation.value.title}"吗？`)) {
      store.cancelReservation(selectedReservation.value.id)
      showDetailModal.value = false
      selectedReservation.value = null
      alert('已取消预定')
    }
  }
}
</script>

<style scoped>
.calendar-view {
  padding: 20px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  color: #303133;
}

.controls {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-group label {
  font-weight: 500;
  color: #606266;
}

.control-group select,
.control-group input {
  min-width: 200px;
}

.calendar-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.room-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.room-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.room-time {
  font-size: 14px;
  color: #909399;
}

.time-grid {
  display: flex;
  min-height: 400px;
}

.time-labels {
  width: 80px;
  background: #fafafa;
  border-right: 1px solid #eee;
}

.time-label {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #f0f0f0;
}

.time-slots {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.time-slot {
  height: 60px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}

.time-slot:hover:not(.disabled):not(.reserved) {
  background: #ecf5ff;
}

.time-slot.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.time-slot.reserved {
  background: #fef0f0;
  cursor: pointer;
}

.time-slot.my-reservation {
  background: #e6f7ff;
}

.time-slot.pending {
  background: #fdf6ec;
}

.slot-time {
  font-size: 12px;
  color: #909399;
}

.reservation-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reservation-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.reservation-user {
  font-size: 12px;
  color: #909399;
}

.reservation-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.reservation-status.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.reservation-status.approved {
  background: #f0f9eb;
  color: #67c23a;
}

.reservation-status.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.reservation-status.cancelled {
  background: #f4f4f5;
  color: #909399;
}

.legend {
  display: flex;
  gap: 24px;
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.available {
  background: white;
  border: 1px solid #dcdfe6;
}

.legend-color.reserved {
  background: #fef0f0;
}

.legend-color.my-reservation {
  background: #e6f7ff;
}

.legend-color.pending {
  background: #fdf6ec;
}

.legend-color.disabled {
  background: #f5f5f5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 16px;
  color: #303133;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #409eff;
}

.admin-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 13px;
  color: #409eff;
}

.notice-icon {
  font-size: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background: #f78989;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.detail-label {
  color: #909399;
  min-width: 80px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-badge.approved {
  background: #f0f9eb;
  color: #67c23a;
}

.status-badge.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.status-badge.cancelled {
  background: #f4f4f5;
  color: #909399;
}
</style>
