// src/infrastructure/services/socket/socket-room.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { Socket } from 'socket.io'

/**
 * SocketRoomService
 * 
 * Service for managing Socket.IO rooms and user presence.
 * Handles room naming conventions and user room management.
 * 
 * @layer Infrastructure
 */
@Injectable()
export class SocketRoomService {
    private readonly logger = new Logger(SocketRoomService.name)

    /**
     * Generate room ID for a user
     */
    getUserRoom(userId: number): string {
        return `user:${userId}`
    }

    /**
     * Generate room ID for a lesson
     */
    getLessonRoom(lessonId: number): string {
        return `lesson:${lessonId}`
    }

    /**
     * Generate room ID for a course
     */
    getCourseRoom(courseId: number): string {
        return `course:${courseId}`
    }

    /**
     * Generate room ID for a class session
     */
    getClassSessionRoom(sessionId: number): string {
        return `class-session:${sessionId}`
    }

    /**
     * Generate room ID for admin users
     */
    getAdminRoom(): string {
        return 'admin'
    }

    /**
     * Generate room ID for student users
     */
    getStudentRoom(): string {
        return 'student'
    }

    /**
     * Generate room ID for a specific role
     */
    getRoleRoom(role: string): string {
        return `role:${role}`
    }

    /**
     * Join user to their personal room
     */
    joinUserRoom(socket: Socket, userId: number) {
        const room = this.getUserRoom(userId)
        socket.join(room)
        this.logger.debug(`User ${userId} joined personal room: ${room}`)
    }

    /**
     * Leave user from their personal room
     */
    leaveUserRoom(socket: Socket, userId: number) {
        const room = this.getUserRoom(userId)
        socket.leave(room)
        this.logger.debug(`User ${userId} left personal room: ${room}`)
    }

    /**
     * Join user to role-based room (admin, student, etc.)
     */
    joinRoleRoom(socket: Socket, role: string) {
        const room = this.getRoleRoom(role)
        socket.join(room)
        this.logger.debug(`Joined role room: ${room}`)
    }

    /**
     * Parse room ID to get type and ID
     * Example: "lesson:123" -> { type: "lesson", id: 123 }
     */
    parseRoomId(roomId: string): { type: string; id: string | number } | null {
        const parts = roomId.split(':')
        if (parts.length !== 2) return null

        const [type, idStr] = parts
        const id = isNaN(Number(idStr)) ? idStr : Number(idStr)

        return { type, id }
    }
}
