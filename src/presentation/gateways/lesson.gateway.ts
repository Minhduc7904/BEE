// src/presentation/gateways/lesson.gateway.ts
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets'
import { UseGuards } from '@nestjs/common'
import { Socket } from 'socket.io'
import { BaseGateway } from './base.gateway'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { RequireWsPermissions } from '../../shared/decorators/ws-permissions.decorator'
import { WsPermissionsGuard } from '../../shared/guards/ws-permissions.guard'

/**
 * LessonGateway
 * 
 * WebSocket gateway for real-time lesson updates.
 * Handles lesson room management and learning item updates.
 * Uses root namespace with room-based routing.
 * 
 * @layer Presentation
 * @endpoint ws://localhost:3000/
 */
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class LessonGateway extends BaseGateway {
    constructor(
        socketService: SocketService,
        socketAuthService: SocketAuthService,
        socketRoomService: SocketRoomService,
    ) {
        super(socketService, socketAuthService, socketRoomService)
    }

    /**
     * Client joins a lesson room to receive updates
     */
    @SubscribeMessage('join-lesson')
    handleJoinLesson(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { lessonId: number }
    ) {
        const user = this.getUser(client)

        if (!data.lessonId) {
            this.emitError(client, 'Lesson ID is required', 'INVALID_LESSON_ID')
            return
        }

        const roomId = this.socketRoomService.getLessonRoom(data.lessonId)
        this.socketService.joinRoom(client, roomId)

        // Notify others in the room
        client.to(roomId).emit('user-joined-lesson', {
            userId: user.userId,
            username: user.username,
            timestamp: new Date().toISOString(),
        })

        this.emitSuccess(client, 'lesson-joined', {
            lessonId: data.lessonId,
            roomId,
        })

        this.logger.debug(`User ${user.userId} joined lesson ${data.lessonId}`)
    }

    /**
     * Client leaves a lesson room
     */
    @SubscribeMessage('leave-lesson')
    handleLeaveLesson(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { lessonId: number }
    ) {
        const user = this.getUser(client)

        if (!data.lessonId) {
            this.emitError(client, 'Lesson ID is required', 'INVALID_LESSON_ID')
            return
        }

        const roomId = this.socketRoomService.getLessonRoom(data.lessonId)
        this.socketService.leaveRoom(client, roomId)

        // Notify others in the room
        client.to(roomId).emit('user-left-lesson', {
            userId: user.userId,
            username: user.username,
            timestamp: new Date().toISOString(),
        })

        this.emitSuccess(client, 'lesson-left', {
            lessonId: data.lessonId,
        })

        this.logger.debug(`User ${user.userId} left lesson ${data.lessonId}`)
    }

    // ========================================
    // SERVER-SIDE METHODS (Called from Use Cases)
    // ========================================

    /**
     * Notify lesson room about learning item update
     * Called from UpdateLearningItemUseCase or UpdateLessonUseCase
     */
    notifyLearningItemUpdate(lessonId: number, learningItem: any) {
        const roomId = this.socketRoomService.getLessonRoom(lessonId)
        
        this.socketService.emitToRoom(roomId, 'learning-item-updated', {
            lessonId,
            learningItem,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified lesson ${lessonId} about learning item update`)
    }

    /**
     * Notify lesson room about learning item creation
     */
    notifyLearningItemCreated(lessonId: number, learningItem: any) {
        const roomId = this.socketRoomService.getLessonRoom(lessonId)
        
        this.socketService.emitToRoom(roomId, 'learning-item-created', {
            lessonId,
            learningItem,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified lesson ${lessonId} about new learning item`)
    }

    /**
     * Notify lesson room about learning item deletion
     */
    notifyLearningItemDeleted(lessonId: number, learningItemId: number) {
        const roomId = this.socketRoomService.getLessonRoom(lessonId)
        
        this.socketService.emitToRoom(roomId, 'learning-item-deleted', {
            lessonId,
            learningItemId,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified lesson ${lessonId} about learning item deletion`)
    }

    /**
     * Notify lesson room about lesson update
     */
    notifyLessonUpdate(lessonId: number, lesson: any) {
        const roomId = this.socketRoomService.getLessonRoom(lessonId)
        
        this.socketService.emitToRoom(roomId, 'lesson-updated', {
            lesson,
            timestamp: new Date().toISOString(),
        })

        this.logger.debug(`Notified lesson ${lessonId} about update`)
    }
}
