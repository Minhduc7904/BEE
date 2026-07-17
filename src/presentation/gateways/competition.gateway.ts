import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { BaseGateway } from './base.gateway'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import {
  FinishCompetitionSubmitUseCase,
  GetCompetitionAnswersUseCase,
  GetCompetitionExamUseCase,
  GetCompetitionRemainingTimeUseCase,
  StartCompetitionAttemptUseCase,
  SubmitCompetitionAnswerUseCase,
} from '../../application/use-cases/competition-submit'
import { SubmitCompetitionAnswerDto } from '../../application/dtos/competition-submit'
import { SOCKET_EVENTS } from '../../shared/constants/socket-events.constant'

type SubmitRoomPayload = { submitId: number }

type SaveAnswerPayload = SubmitRoomPayload & {
  answerId: number
  answer?: SubmitCompetitionAnswerDto['answer']
  selectedStatementIds?: SubmitCompetitionAnswerDto['selectedStatementIds']
  trueFalseAnswers?: SubmitCompetitionAnswerDto['trueFalseAnswers']
  timeSpentSeconds?: SubmitCompetitionAnswerDto['timeSpentSeconds']
}

type FinishAttemptPayload = SubmitRoomPayload & { homeworkContentId?: number }

/**
 * WebSocket entry point for a student's own competition attempt.
 *
 * This gateway deliberately has no shared `competition:<competitionId>` room.
 * State is sent either to the authenticated user's room or to the private
 * `competition-submit:<submitId>` room used by that student's open tabs.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class CompetitionGateway extends BaseGateway {
  constructor(
    socketService: SocketService,
    socketAuthService: SocketAuthService,
    socketRoomService: SocketRoomService,
    private readonly startCompetitionAttemptUseCase: StartCompetitionAttemptUseCase,
    private readonly getCompetitionExamUseCase: GetCompetitionExamUseCase,
    private readonly getCompetitionAnswersUseCase: GetCompetitionAnswersUseCase,
    private readonly submitCompetitionAnswerUseCase: SubmitCompetitionAnswerUseCase,
    private readonly getCompetitionRemainingTimeUseCase: GetCompetitionRemainingTimeUseCase,
    private readonly finishCompetitionSubmitUseCase: FinishCompetitionSubmitUseCase,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.ATTEMPT_START)
  async startAttempt(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { competitionId: number },
  ) {
    const studentId = this.requireStudent(client)
    if (!studentId || !payload?.competitionId) return

    try {
      const result = await this.startCompetitionAttemptUseCase.execute(payload.competitionId, studentId)
      if (!result.success || !result.data) {
        const code = typeof result.data === 'object' && 'code' in result.data
          ? String(result.data.code)
          : 'ATTEMPT_START_FAILED'
        this.emitError(client, result.message || 'Không thể bắt đầu lượt làm bài', code)
        return
      }

      const submitId = result.data.competitionSubmitId
      this.joinSubmitRoom(client, submitId)
      this.emitSuccess(client, SOCKET_EVENTS.COMPETITION.ATTEMPT_STARTED, { attempt: result.data })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'ATTEMPT_START_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.EXAM_GET)
  async getExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { competitionId: number },
  ) {
    if (!this.requireStudent(client) || !payload?.competitionId) return

    try {
      const exam = await this.getCompetitionExamUseCase.execute(payload.competitionId)
      this.emitSuccess(client, SOCKET_EVENTS.COMPETITION.EXAM_LOADED, { exam: exam.data })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'EXAM_LOAD_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.ATTEMPT_SUBSCRIBE)
  async subscribeAttempt(@ConnectedSocket() client: Socket, @MessageBody() payload: SubmitRoomPayload) {
    const studentId = this.requireStudent(client)
    if (!studentId || !payload?.submitId) return

    try {
      // Getting answers verifies that the attempt belongs to this student before joining its room.
      const answers = await this.getCompetitionAnswersUseCase.execute(payload.submitId, studentId)
      const time = await this.getCompetitionRemainingTimeUseCase.execute(payload.submitId)

      this.joinSubmitRoom(client, payload.submitId)
      this.emitSuccess(client, SOCKET_EVENTS.COMPETITION.ATTEMPT_SUBSCRIBED, {
        submitId: payload.submitId,
        answers: answers.data,
        time: time.data,
      })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'ATTEMPT_SUBSCRIBE_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.ANSWER_SAVE)
  async saveAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: SaveAnswerPayload) {
    const studentId = this.requireStudent(client)
    if (!studentId || !payload?.submitId || !payload?.answerId) return

    try {
      const answer: SubmitCompetitionAnswerDto = {
        answer: payload.answer,
        selectedStatementIds: payload.selectedStatementIds,
        trueFalseAnswers: payload.trueFalseAnswers,
        timeSpentSeconds: payload.timeSpentSeconds,
      }
      const result = await this.submitCompetitionAnswerUseCase.execute(
        payload.submitId,
        payload.answerId,
        answer,
        studentId,
      )

      if (!result.success) {
        this.emitError(client, result.message || 'Không thể lưu đáp án', 'ANSWER_SAVE_FAILED')
        return
      }

      this.socketService.emitToRoom(this.getSubmitRoom(payload.submitId), SOCKET_EVENTS.COMPETITION.ANSWER_SAVED, {
        success: true,
        submitId: payload.submitId,
        answerId: payload.answerId,
        answer: result.data,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'ANSWER_SAVE_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.TIME_GET)
  async getRemainingTime(@ConnectedSocket() client: Socket, @MessageBody() payload: SubmitRoomPayload) {
    const studentId = this.requireStudent(client)
    if (!studentId || !payload?.submitId) return

    try {
      // Ownership is checked first through the existing answer query.
      await this.getCompetitionAnswersUseCase.execute(payload.submitId, studentId)
      const time = await this.getCompetitionRemainingTimeUseCase.execute(payload.submitId)
      this.emitSuccess(client, SOCKET_EVENTS.COMPETITION.TIME_SYNC, {
        submitId: payload.submitId,
        time: time.data,
      })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'TIME_GET_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COMPETITION.ATTEMPT_FINISH)
  async finishAttempt(@ConnectedSocket() client: Socket, @MessageBody() payload: FinishAttemptPayload) {
    const studentId = this.requireStudent(client)
    if (!studentId || !payload?.submitId) return
    const userId = this.getUser(client)?.userId

    this.logger.log(
      `[Competition finish] Received | socket=${client.id} userId=${userId} studentId=${studentId} submitId=${payload.submitId}`,
    )

    try {
      const result = await this.finishCompetitionSubmitUseCase.execute(
        payload.submitId,
        studentId,
        payload.homeworkContentId,
      )

      this.logger.log(
        `[Competition finish] Use case completed | submitId=${payload.submitId} success=${result.success} status=${result.data?.status ?? 'N/A'}`,
      )

      if (!result.success) {
        const code = typeof result.data === 'object' && result.data && 'code' in result.data
          ? String(result.data.code)
          : 'ATTEMPT_FINISH_FAILED'
        this.logger.warn(`[Competition finish] Rejected | submitId=${payload.submitId} code=${code}`)
        this.emitError(client, result.message || 'Không thể nộp bài', code)
        return
      }

      this.socketService.emitToUser(userId, SOCKET_EVENTS.COMPETITION.ATTEMPT_FINISHED, {
        success: true,
        result: result.data,
        timestamp: new Date().toISOString(),
      })
      this.logger.log(
        `[Competition finish] Result emitted | userId=${userId} submitId=${payload.submitId} competitionSubmitId=${result.data?.competitionSubmitId}`,
      )
      // The app keeps one socket alive across routes. Remove all tabs for this
      // attempt from the private answer-sync room once its submission is final.
      this.server.in(this.getSubmitRoom(payload.submitId)).socketsLeave(this.getSubmitRoom(payload.submitId))
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'ATTEMPT_FINISH_FAILED')
    }
  }

  private requireStudent(client: Socket): number | null {
    const studentId = this.getUser(client)?.studentId
    if (!studentId) {
      this.emitError(client, 'Chỉ học sinh mới có thể thực hiện thao tác này', 'STUDENT_REQUIRED')
      return null
    }
    return studentId
  }

  private getSubmitRoom(submitId: number): string {
    return `competition-submit:${submitId}`
  }

  private joinSubmitRoom(client: Socket, submitId: number): void {
    this.socketService.joinRoom(client, this.getSubmitRoom(submitId))
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
  }
}
