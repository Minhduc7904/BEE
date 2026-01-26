// src/infrastructure/socket.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import jwtConfig from '../config/jwt.config'
import { SocketService } from './services/socket/socket.service'
import { SocketAuthService } from './services/socket/socket-auth.service'
import { SocketRoomService } from './services/socket/socket-room.service'
import { JwtTokenService } from './services/jwt.service'
import { NotificationRealtimeService } from './services/notification/notification-realtime.service'
import { StatusRealtimeService } from './services/socket/status-realtime.service'
/**
 * SocketModule
 * 
 * Module for Socket.IO infrastructure services.
 * Provides core socket functionality for real-time communication.
 * 
 * @layer Infrastructure
 * @exports SocketService, SocketAuthService, SocketRoomService
 */
@Module({
    imports: [
        ConfigModule.forFeature(jwtConfig), // Import jwt config for JwtTokenService
        JwtModule.registerAsync({
            imports: [ConfigModule.forFeature(jwtConfig)],
            inject: [jwtConfig.KEY],
            useFactory: (config: any) => ({
                secret: config.accessSecret,
                signOptions: {
                    expiresIn: config.accessExpiresIn,
                },
            }),
        }),
    ],
    providers: [
        SocketService,
        SocketAuthService,
        SocketRoomService,
        JwtTokenService, // Required for token validation
        NotificationRealtimeService, // Real-time notification service
        StatusRealtimeService, // Real-time status service
    ],
    exports: [
        SocketService,
        SocketAuthService,
        SocketRoomService,
        NotificationRealtimeService,
        StatusRealtimeService,
    ],
})
export class SocketModule { }
