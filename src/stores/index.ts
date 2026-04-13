import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, MeetingRoom, Reservation, ReservationStatus } from '../types'

const generateId = () => Math.random().toString(36).substr(2, 9)

const initialUsers: User[] = [
  { id: '1', name: '管理员', role: 'admin' },
  { id: '2', name: '张三', role: 'user' },
  { id: '3', name: '李四', role: 'user' },
  { id: '4', name: '王五', role: 'user' },
]

const initialRooms: MeetingRoom[] = [
  { id: '1', name: '会议室A', location: '1楼101', disabled: false, openTimeStart: '08:00', openTimeEnd: '18:00' },
  { id: '2', name: '会议室B', location: '1楼102', disabled: false, openTimeStart: '08:00', openTimeEnd: '18:00' },
  { id: '3', name: '会议室C', location: '2楼201', disabled: false, openTimeStart: '09:00', openTimeEnd: '17:00' },
  { id: '4', name: '会议室D', location: '2楼202', disabled: false, openTimeStart: '08:30', openTimeEnd: '18:30' },
  { id: '5', name: '会议室E', location: '3楼301', disabled: false, openTimeStart: '08:00', openTimeEnd: '20:00' },
]

export const useStore = defineStore('app', () => {
  const currentUser = ref<User>(initialUsers[1])
  const users = ref<User[]>(initialUsers)
  const rooms = ref<MeetingRoom[]>(initialRooms)
  const reservations = ref<Reservation[]>([])

  const isAdmin = computed(() => currentUser.value.role === 'admin')
  const availableRooms = computed(() => rooms.value.filter(r => !r.disabled))

  function setCurrentUser(userId: string) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
    }
  }

  function addRoom(room: Omit<MeetingRoom, 'id'>) {
    const newRoom: MeetingRoom = {
      ...room,
      id: generateId(),
    }
    rooms.value.push(newRoom)
    return newRoom
  }

  function updateRoom(id: string, updates: Partial<MeetingRoom>) {
    const index = rooms.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rooms.value[index] = { ...rooms.value[index], ...updates }
    }
  }

  function deleteRoom(id: string) {
    const index = rooms.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rooms.value.splice(index, 1)
    }
  }

  function addReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'reviewedAt' | 'reviewedBy'>, isAdminReservation: boolean = false) {
    const status: ReservationStatus = isAdminReservation ? 'approved' : 'pending'
    const newReservation: Reservation = {
      ...reservation,
      id: generateId(),
      status,
      createdAt: new Date().toISOString(),
      reviewedAt: isAdminReservation ? new Date().toISOString() : undefined,
      reviewedBy: isAdminReservation ? currentUser.value.id : undefined,
    }
    reservations.value.push(newReservation)
    return newReservation
  }

  function updateReservationStatus(id: string, status: ReservationStatus) {
    const reservation = reservations.value.find(r => r.id === id)
    if (reservation) {
      reservation.status = status
      reservation.reviewedAt = new Date().toISOString()
      reservation.reviewedBy = currentUser.value.id
    }
  }

  function approveReservation(id: string) {
    updateReservationStatus(id, 'approved')
  }

  function rejectReservation(id: string) {
    updateReservationStatus(id, 'rejected')
  }

  function cancelReservation(id: string) {
    const reservation = reservations.value.find(r => r.id === id)
    if (reservation && (reservation.status === 'pending' || reservation.status === 'approved')) {
      reservation.status = 'cancelled'
    }
  }

  function getPendingReservations() {
    return reservations.value.filter(r => r.status === 'pending')
  }

  function getApprovedReservationsByRoomAndDate(roomId: string, date: string) {
    return reservations.value.filter(r => 
      r.roomId === roomId && 
      r.date === date && 
      (r.status === 'approved' || r.status === 'pending')
    )
  }

  function deleteReservation(id: string) {
    const index = reservations.value.findIndex(r => r.id === id)
    if (index !== -1) {
      reservations.value.splice(index, 1)
    }
  }

  function getReservationsByRoomAndDate(roomId: string, date: string) {
    return reservations.value.filter(r => r.roomId === roomId && r.date === date)
  }

  function getReservationsByUser(userId: string) {
    return reservations.value.filter(r => r.userId === userId)
  }

  function checkTimeConflict(roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) {
    const roomReservations = reservations.value.filter(
      r => r.roomId === roomId && 
           r.date === date && 
           r.id !== excludeId &&
           (r.status === 'approved' || r.status === 'pending')
    )
    
    for (const reservation of roomReservations) {
      const existingStart = reservation.startTime
      const existingEnd = reservation.endTime
      
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        return true
      }
    }
    return false
  }

  return {
    currentUser,
    users,
    rooms,
    reservations,
    isAdmin,
    availableRooms,
    setCurrentUser,
    addRoom,
    updateRoom,
    deleteRoom,
    addReservation,
    deleteReservation,
    updateReservationStatus,
    approveReservation,
    rejectReservation,
    cancelReservation,
    getReservationsByRoomAndDate,
    getApprovedReservationsByRoomAndDate,
    getReservationsByUser,
    getPendingReservations,
    checkTimeConflict,
  }
})
