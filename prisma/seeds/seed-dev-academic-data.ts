import {
  AttendanceStatus,
  CompetitionSubmitStatus,
  CourseEnrollmentStatus,
  CourseEnrollmentType,
  CourseType,
  Difficulty,
  ExamAttemptStatus,
  ExamVisibility,
  HomeworkContentType,
  LearningItemType,
  Prisma,
  PrismaClient,
  QuestionType,
  TypeOfExam,
  Visibility,
} from '@prisma/client'
import { DevParentFixtureContext, DevStudentFixture } from './seed-dev-parent-auth-student'

// Mọi bảng thiếu unique nghiệp vụ (không thể upsert theo composite key) được ghim vào
// dải ID cố định này để chạy lại nhiều lần vẫn idempotent. Mốc 987_000_000 được chọn để
// không bao giờ va chạm với ID autoincrement thật (luôn bắt đầu từ 1) của cùng bảng.
const DEV_ID_BASE = 987_000_000
const DEV_SEED_MARKER = '[DEV-SEED]'

const NS = {
  courseClass: DEV_ID_BASE + 100_000,
  lesson: DEV_ID_BASE + 200_000,
  classSession: DEV_ID_BASE + 300_000,
  learningItem: DEV_ID_BASE + 400_000,
  homeworkContent: DEV_ID_BASE + 500_000,
  documentContent: DEV_ID_BASE + 600_000,
  youtubeContent: DEV_ID_BASE + 700_000,
  videoContent: DEV_ID_BASE + 800_000,
  competition: DEV_ID_BASE + 900_000,
  statement: DEV_ID_BASE + 1_000_000,
  examAttempt: DEV_ID_BASE + 1_100_000,
  questionAnswer: DEV_ID_BASE + 1_200_000,
}

const classId = (i: number) => NS.courseClass + i
const lessonId = (i: number, l: number) => NS.lesson + i * 10 + l
const sessionId = (i: number, s: number) => NS.classSession + i * 100 + s
const learningItemId = (i: number, n: number) => NS.learningItem + i * 100 + n
const homeworkContentId = (i: number, n: number) => NS.homeworkContent + i * 100 + n
const documentContentId = (i: number) => NS.documentContent + i
const youtubeContentId = (i: number) => NS.youtubeContent + i
const videoContentId = (i: number) => NS.videoContent + i
const competitionId = (i: number, c: number) => NS.competition + i * 10 + c
const statementId = (i: number, q: number, s: number) => NS.statement + i * 1000 + q * 10 + s
const examAttemptId = (i: number) => NS.examAttempt + i
const questionAnswerId = (i: number, q: number) => NS.questionAnswer + i * 100 + q

const d = (year: number, month: number, day: number, hour = 0, minute = 0): Date =>
  new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

// Chapter cha-con của môn Toán (id 1-36 trong CHAPTERS) chỉ phủ khối 10-12; dev fixture
// dùng lại các chapter con này cho mọi khối vì hệ thống chưa có chương trình khối 6-9.
const CHAPTER_POOL = [2, 3, 5, 6, 8, 9, 11, 12, 13, 14]

interface StatementDef {
  content: string
  isCorrect: boolean
}

interface QuestionDef {
  content: string
  type: QuestionType
  difficulty: Difficulty
  pointsOrigin: number
  correctAnswer?: string
  solution: string
  statements?: StatementDef[]
}

const QUESTION_BANK: QuestionDef[] = [
  {
    content: 'Kết quả của phép tính 12 + 8 bằng bao nhiêu?',
    type: QuestionType.SINGLE_CHOICE,
    difficulty: Difficulty.NB,
    pointsOrigin: 0.5,
    solution: '12 + 8 = 20.',
    statements: [
      { content: '18', isCorrect: false },
      { content: '20', isCorrect: true },
      { content: '22', isCorrect: false },
      { content: '24', isCorrect: false },
    ],
  },
  {
    content: 'Số nào sau đây là số nguyên tố?',
    type: QuestionType.SINGLE_CHOICE,
    difficulty: Difficulty.TH,
    pointsOrigin: 0.5,
    solution: '17 chỉ chia hết cho 1 và chính nó nên là số nguyên tố.',
    statements: [
      { content: '21', isCorrect: false },
      { content: '9', isCorrect: false },
      { content: '17', isCorrect: true },
      { content: '27', isCorrect: false },
    ],
  },
  {
    content: 'Chọn các khẳng định đúng về hình vuông.',
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.VD,
    pointsOrigin: 0.75,
    solution: 'Hình vuông có 4 cạnh bằng nhau và 4 góc vuông.',
    statements: [
      { content: '4 cạnh bằng nhau', isCorrect: true },
      { content: '4 góc vuông', isCorrect: true },
      { content: '2 đường chéo không bằng nhau', isCorrect: false },
      { content: 'Chỉ có 1 trục đối xứng', isCorrect: false },
    ],
  },
  {
    content: 'Chọn các phân số bằng 1/2.',
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.VDC,
    pointsOrigin: 0.75,
    solution: '2/4 và 3/6 đều rút gọn về 1/2.',
    statements: [
      { content: '2/4', isCorrect: true },
      { content: '3/6', isCorrect: true },
      { content: '3/5', isCorrect: false },
      { content: '5/8', isCorrect: false },
    ],
  },
  {
    content: 'Xét các khẳng định sau về số chẵn, số lẻ.',
    type: QuestionType.TRUE_FALSE,
    difficulty: Difficulty.NB,
    pointsOrigin: 1,
    solution: 'a) Đúng. b) Sai vì 9 là số lẻ. c) Đúng. d) Sai vì 0 là số chẵn.',
    statements: [
      { content: 'a) Tổng hai số chẵn luôn là số chẵn', isCorrect: true },
      { content: 'b) 9 là số chẵn', isCorrect: false },
      { content: 'c) Tích của một số chẵn với một số bất kỳ luôn là số chẵn', isCorrect: true },
      { content: 'd) 0 không phải là số chẵn', isCorrect: false },
    ],
  },
  {
    content: 'Xét các khẳng định sau về phân số.',
    type: QuestionType.TRUE_FALSE,
    difficulty: Difficulty.TH,
    pointsOrigin: 1,
    solution: 'a) Đúng. b) Đúng. c) Sai vì 1/3 < 1/2. d) Đúng.',
    statements: [
      { content: 'a) 2/4 = 1/2', isCorrect: true },
      { content: 'b) Phân số 3/6 tối giản là 1/2', isCorrect: true },
      { content: 'c) 1/3 lớn hơn 1/2', isCorrect: false },
      { content: 'd) 5/10 = 1/2', isCorrect: true },
    ],
  },
  {
    content: 'Tìm x biết x + 5 = 20.',
    type: QuestionType.SHORT_ANSWER,
    difficulty: Difficulty.VD,
    pointsOrigin: 1,
    correctAnswer: '15',
    solution: 'x = 20 - 5 = 15.',
  },
  {
    content: 'Tính căn bậc hai của 81.',
    type: QuestionType.SHORT_ANSWER,
    difficulty: Difficulty.VDC,
    pointsOrigin: 1,
    correctAnswer: '9',
    solution: 'Vì 9 x 9 = 81 nên căn bậc hai của 81 là 9.',
  },
  {
    content: 'Trình bày cách giải phương trình bậc nhất một ẩn 2x - 4 = 10.',
    type: QuestionType.ESSAY,
    difficulty: Difficulty.NB,
    pointsOrigin: 1.75,
    solution: '2x - 4 = 10 ⇔ 2x = 14 ⇔ x = 7.',
  },
  {
    content: 'Chứng minh tổng ba góc trong một tam giác bằng 180 độ.',
    type: QuestionType.ESSAY,
    difficulty: Difficulty.TH,
    pointsOrigin: 1.75,
    solution: 'Kẻ đường thẳng qua một đỉnh song song với cạnh đối diện rồi dùng tính chất góc so le trong.',
  },
]

const SECTION_DEFS = [
  { order: 1, title: 'Phần I – Trắc nghiệm', questionIndexes: [0, 1, 2, 3] },
  { order: 2, title: 'Phần II – Đúng/Sai và trả lời ngắn', questionIndexes: [4, 5, 6, 7] },
  { order: 3, title: 'Phần III – Tự luận', questionIndexes: [8, 9] },
]

function distributePoints(questionMax: number[], ratio: number | null): (number | null)[] {
  if (ratio === null) return questionMax.map(() => null)
  if (ratio <= 0) return questionMax.map(() => 0)
  const raw = questionMax.map((max) => Math.round(max * ratio * 100) / 100)
  const target = Math.round(questionMax.reduce((sum, max) => sum + max, 0) * ratio * 100) / 100
  const drift = Math.round((target - raw.reduce((sum, value) => sum + value, 0)) * 100) / 100
  raw[raw.length - 1] = Math.round((raw[raw.length - 1] + drift) * 100) / 100
  return raw
}

interface AnswerPayload {
  answer: string | null
  selectedStatementIds: number[] | null
  isCorrect: boolean | null
}

function buildAnswerPayload(
  question: QuestionDef,
  statementIds: number[],
  awarded: number | null,
  max: number,
): AnswerPayload {
  if (awarded === null) return { answer: null, selectedStatementIds: null, isCorrect: null }

  const isCorrect = awarded >= max * 0.999
  const isZero = awarded <= max * 0.001

  if (question.type === QuestionType.SHORT_ANSWER) {
    return {
      answer: isCorrect ? (question.correctAnswer ?? '') : '0',
      selectedStatementIds: null,
      isCorrect,
    }
  }

  if (question.type === QuestionType.ESSAY) {
    return {
      answer: `${DEV_SEED_MARKER} Bài làm tự luận của học sinh (điểm ${awarded}/${max}).`,
      selectedStatementIds: null,
      isCorrect: null,
    }
  }

  if (question.type === QuestionType.SINGLE_CHOICE) {
    const correctIndex = (question.statements ?? []).findIndex((s) => s.isCorrect)
    const chosenIndex = isCorrect ? correctIndex : (correctIndex + 1) % statementIds.length
    return { answer: null, selectedStatementIds: [statementIds[chosenIndex]], isCorrect }
  }

  // MULTIPLE_CHOICE và TRUE_FALSE: chọn đủ/thiếu/thừa tuỳ theo điểm đạt được để có
  // đủ biến thể đúng/sai/một phần trên dữ liệu chấm.
  const correctIds = (question.statements ?? [])
    .map((s, idx) => (s.isCorrect ? statementIds[idx] : null))
    .filter((id): id is number => id !== null)
  if (isCorrect) return { answer: null, selectedStatementIds: correctIds, isCorrect: true }
  if (isZero) {
    const wrongIds = statementIds.filter((id) => !correctIds.includes(id))
    return { answer: null, selectedStatementIds: wrongIds, isCorrect: false }
  }
  return { answer: null, selectedStatementIds: correctIds.slice(0, 1), isCorrect: false }
}

interface PreflightSpec {
  label: string
  ids: number[]
  find: (ids: number[]) => Promise<Array<{ id: number; marker: string | null }>>
}

async function runPreflight(prisma: PrismaClient, specs: PreflightSpec[]): Promise<void> {
  for (const spec of specs) {
    if (spec.ids.length === 0) continue
    const existing = await spec.find(spec.ids)
    const foreign = existing.filter((row) => !row.marker || !row.marker.includes(DEV_SEED_MARKER))
    if (foreign.length > 0) {
      throw new Error(
        `Dev seed bị dừng: bảng ${spec.label} đã có dữ liệu không thuộc ${DEV_SEED_MARKER} tại ID ${foreign
          .map((row) => row.id)
          .join(', ')}. Kiểm tra lại trước khi chạy seed:dev.`,
      )
    }
  }
}

async function buildPreflightSpecs(prisma: PrismaClient, studentIndexes: number[]): Promise<PreflightSpec[]> {
  const homeworkNs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const competitionNs = [0, 1, 2, 3, 4, 5, 6, 7]
  const lessonNs = [0, 1, 2, 3]
  const sessionNs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const questionAnswerNs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return [
    {
      label: 'courses_classes',
      ids: studentIndexes.map(classId),
      find: async (ids) =>
        (await prisma.courseClass.findMany({ where: { classId: { in: ids } }, select: { classId: true, className: true } })).map(
          (row) => ({ id: row.classId, marker: row.className }),
        ),
    },
    {
      label: 'lessons',
      ids: studentIndexes.flatMap((i) => lessonNs.map((l) => lessonId(i, l))),
      find: async (ids) =>
        (await prisma.lesson.findMany({ where: { lessonId: { in: ids } }, select: { lessonId: true, title: true } })).map((row) => ({
          id: row.lessonId,
          marker: row.title,
        })),
    },
    {
      label: 'class_sessions',
      ids: studentIndexes.flatMap((i) => sessionNs.map((s) => sessionId(i, s))),
      find: async (ids) =>
        (await prisma.classSession.findMany({ where: { sessionId: { in: ids } }, select: { sessionId: true, name: true } })).map(
          (row) => ({ id: row.sessionId, marker: row.name }),
        ),
    },
    {
      label: 'learning_items',
      ids: studentIndexes.flatMap((i) => [...homeworkNs, 12, 13, 14].map((n) => learningItemId(i, n))),
      find: async (ids) =>
        (await prisma.learningItem.findMany({ where: { learningItemId: { in: ids } }, select: { learningItemId: true, title: true } })).map(
          (row) => ({ id: row.learningItemId, marker: row.title }),
        ),
    },
    {
      label: 'homework_contents',
      ids: studentIndexes.flatMap((i) => homeworkNs.map((n) => homeworkContentId(i, n))),
      find: async (ids) =>
        (
          await prisma.homeworkContent.findMany({
            where: { homeworkContentId: { in: ids } },
            select: { homeworkContentId: true, content: true },
          })
        ).map((row) => ({ id: row.homeworkContentId, marker: row.content })),
    },
    {
      label: 'document_contents',
      ids: studentIndexes.map(documentContentId),
      find: async (ids) =>
        (
          await prisma.documentContent.findMany({
            where: { documentContentId: { in: ids } },
            select: { documentContentId: true, content: true },
          })
        ).map((row) => ({ id: row.documentContentId, marker: row.content })),
    },
    {
      label: 'youtube_contents',
      ids: studentIndexes.map(youtubeContentId),
      find: async (ids) =>
        (
          await prisma.youtubeContent.findMany({
            where: { youtubeContentId: { in: ids } },
            select: { youtubeContentId: true, content: true },
          })
        ).map((row) => ({ id: row.youtubeContentId, marker: row.content })),
    },
    {
      label: 'video_contents',
      ids: studentIndexes.map(videoContentId),
      find: async (ids) =>
        (
          await prisma.videoContent.findMany({ where: { videoContentId: { in: ids } }, select: { videoContentId: true, content: true } })
        ).map((row) => ({ id: row.videoContentId, marker: row.content })),
    },
    {
      label: 'competitions',
      ids: studentIndexes.flatMap((i) => competitionNs.map((c) => competitionId(i, c))),
      find: async (ids) =>
        (await prisma.competition.findMany({ where: { competitionId: { in: ids } }, select: { competitionId: true, title: true } })).map(
          (row) => ({ id: row.competitionId, marker: row.title }),
        ),
    },
    {
      label: 'statements',
      ids: studentIndexes.flatMap((i) =>
        QUESTION_BANK.flatMap((question, q) => (question.statements ?? []).map((_, s) => statementId(i, q, s))),
      ),
      find: async (ids) =>
        (await prisma.statement.findMany({ where: { statementId: { in: ids } }, select: { statementId: true, content: true } })).map(
          (row) => ({ id: row.statementId, marker: row.content }),
        ),
    },
    {
      label: 'exam_attempts',
      ids: studentIndexes.map(examAttemptId),
      find: async (ids) =>
        (await prisma.examAttempt.findMany({ where: { attemptId: { in: ids } }, select: { attemptId: true, feedback: true } })).map(
          (row) => ({ id: row.attemptId, marker: row.feedback }),
        ),
    },
    {
      // answer thật (SHORT_ANSWER) không mang marker để giữ dữ liệu chấm điểm hợp lệ,
      // nên ownership được xác nhận qua ExamAttempt cha (đã có marker ở feedback).
      label: 'question_answers',
      ids: studentIndexes.flatMap((i) => questionAnswerNs.map((q) => questionAnswerId(i, q))),
      find: async (ids) =>
        (
          await prisma.questionAnswer.findMany({
            where: { questionAnswerId: { in: ids } },
            select: { questionAnswerId: true, examAttempt: { select: { feedback: true } } },
          })
        ).map((row) => ({ id: row.questionAnswerId, marker: row.examAttempt?.feedback ?? null })),
    },
  ]
}

interface HomeworkPlanItem {
  n: number
  kind: HomeworkContentType
  compIndex: number | null
  ratio: number | null
  maxPointsOverride: number | null
  filePoints: number | null
  feedback: string | null
  late: boolean
  allowLateSubmit: boolean
  updatePointsOnLateSubmit: boolean
  dueDate: Date
  submitAt: Date
  graded: boolean
}

const HOMEWORK_PLAN: HomeworkPlanItem[] = [
  {
    n: 0,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 0,
    ratio: 0.85,
    maxPointsOverride: null,
    filePoints: null,
    feedback: 'Bài làm tốt, cần chú ý trình bày.',
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 8, 10),
    submitAt: d(2026, 8, 9),
    graded: true,
  },
  {
    n: 1,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 1,
    ratio: 0.675,
    maxPointsOverride: null,
    filePoints: null,
    feedback: null,
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 8, 17),
    submitAt: d(2026, 8, 16),
    graded: true,
  },
  {
    n: 2,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 2,
    ratio: 0.9,
    maxPointsOverride: null,
    filePoints: null,
    feedback: 'Nộp muộn nhưng vẫn được tính điểm theo chính sách của lớp.',
    late: true,
    allowLateSubmit: true,
    updatePointsOnLateSubmit: true,
    dueDate: d(2026, 8, 24),
    submitAt: d(2026, 8, 26),
    graded: true,
  },
  {
    n: 3,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 3,
    ratio: null,
    maxPointsOverride: null,
    filePoints: null,
    feedback: null,
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 8, 31),
    submitAt: d(2026, 8, 30),
    graded: false,
  },
  {
    n: 4,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 4,
    ratio: 0.75,
    maxPointsOverride: 20,
    filePoints: null,
    feedback: 'Cuộc thi nhân đôi điểm số, làm rất tốt phần đầu.',
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 9, 7),
    submitAt: d(2026, 9, 6),
    graded: true,
  },
  {
    n: 5,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 5,
    ratio: 1,
    maxPointsOverride: null,
    filePoints: null,
    feedback: null,
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 9, 14),
    submitAt: d(2026, 9, 13),
    graded: true,
  },
  {
    n: 6,
    kind: HomeworkContentType.COMPETITION,
    compIndex: 6,
    ratio: 0.225,
    maxPointsOverride: null,
    filePoints: null,
    feedback: 'Cần ôn lại phần đầu bài, còn nhiều lỗi cơ bản.',
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 9, 21),
    submitAt: d(2026, 9, 20),
    graded: true,
  },
  {
    n: 7,
    kind: HomeworkContentType.FILE_UPLOAD,
    compIndex: null,
    ratio: null,
    maxPointsOverride: null,
    filePoints: 100,
    feedback: 'File bài làm rõ ràng, trình bày sạch đẹp.',
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 9, 28),
    submitAt: d(2026, 9, 27),
    graded: true,
  },
  {
    n: 8,
    kind: HomeworkContentType.FILE_UPLOAD,
    compIndex: null,
    ratio: null,
    maxPointsOverride: null,
    filePoints: 20,
    feedback: null,
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 10, 5),
    submitAt: d(2026, 10, 4),
    graded: true,
  },
  {
    n: 9,
    kind: HomeworkContentType.FILE_UPLOAD,
    compIndex: null,
    ratio: null,
    maxPointsOverride: null,
    filePoints: 45.5,
    feedback: 'Nộp muộn 2 ngày, trừ nhẹ vào điểm quá trình.',
    late: true,
    allowLateSubmit: true,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 10, 12),
    submitAt: d(2026, 10, 14),
    graded: true,
  },
  {
    n: 10,
    kind: HomeworkContentType.FILE_UPLOAD,
    compIndex: null,
    ratio: null,
    maxPointsOverride: null,
    filePoints: null,
    feedback: null,
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 10, 19),
    submitAt: d(2026, 10, 18),
    graded: false,
  },
  {
    n: 11,
    kind: HomeworkContentType.FILE_UPLOAD,
    compIndex: null,
    ratio: null,
    maxPointsOverride: null,
    filePoints: 78,
    feedback: 'Bài làm đầy đủ, đúng hướng dẫn.',
    late: false,
    allowLateSubmit: false,
    updatePointsOnLateSubmit: false,
    dueDate: d(2026, 10, 26),
    submitAt: d(2026, 10, 25),
    graded: true,
  },
]

interface StandalonePlanItem {
  attemptNumber: number
  status: CompetitionSubmitStatus
  ratio: number | null
  submittedAt: Date | null
  hasAnswers: boolean
}

const STANDALONE_PLAN: StandalonePlanItem[] = [
  { attemptNumber: 1, status: CompetitionSubmitStatus.GRADED, ratio: 0.95, submittedAt: d(2026, 8, 5), hasAnswers: true },
  { attemptNumber: 2, status: CompetitionSubmitStatus.GRADED, ratio: 0.725, submittedAt: d(2026, 8, 12), hasAnswers: true },
  { attemptNumber: 3, status: CompetitionSubmitStatus.GRADED, ratio: 0.6, submittedAt: d(2026, 8, 19), hasAnswers: true },
  { attemptNumber: 4, status: CompetitionSubmitStatus.GRADED, ratio: 0.875, submittedAt: d(2026, 8, 26), hasAnswers: true },
  { attemptNumber: 5, status: CompetitionSubmitStatus.GRADED, ratio: 0.55, submittedAt: d(2026, 9, 2), hasAnswers: true },
  { attemptNumber: 6, status: CompetitionSubmitStatus.GRADED, ratio: 1, submittedAt: d(2026, 9, 9), hasAnswers: true },
  { attemptNumber: 7, status: CompetitionSubmitStatus.GRADED, ratio: 0.425, submittedAt: d(2026, 9, 16), hasAnswers: true },
  { attemptNumber: 8, status: CompetitionSubmitStatus.GRADED, ratio: 0.8, submittedAt: d(2026, 9, 23), hasAnswers: true },
  { attemptNumber: 9, status: CompetitionSubmitStatus.SUBMITTED, ratio: null, submittedAt: d(2026, 9, 30), hasAnswers: true },
  { attemptNumber: 10, status: CompetitionSubmitStatus.SUBMITTED, ratio: null, submittedAt: d(2026, 10, 7), hasAnswers: true },
  { attemptNumber: 11, status: CompetitionSubmitStatus.SUBMITTED, ratio: null, submittedAt: d(2026, 10, 14), hasAnswers: true },
  { attemptNumber: 12, status: CompetitionSubmitStatus.SUBMITTED, ratio: null, submittedAt: d(2026, 10, 21), hasAnswers: true },
  { attemptNumber: 13, status: CompetitionSubmitStatus.IN_PROGRESS, ratio: null, submittedAt: null, hasAnswers: false },
  { attemptNumber: 14, status: CompetitionSubmitStatus.ABANDONED, ratio: null, submittedAt: null, hasAnswers: false },
]

interface StudentSeedSummary {
  studentId: number
  fullName: string
  grade: number
  username: string
  courseCode: string
  examSlug: string
  homeworkSubmits: number
  homeworkScored: number
  homeworkAvgExpected: number | null
  standaloneTotal: number
  standaloneVisible: number
  standaloneScored: number
  standaloneAvgExpected: number | null
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

async function seedStudentAcademicData(
  prisma: PrismaClient,
  student: DevStudentFixture,
  teacherAdminId: number,
): Promise<StudentSeedSummary> {
  const i = student.index
  const grade = student.grade

  const course = await prisma.course.upsert({
    where: { code: `DEV-MATH-S${i + 1}` },
    update: {
      title: `${DEV_SEED_MARKER} Toán ${grade} - Lớp phát triển ${i + 1}`,
      grade,
      subjectId: 1,
      teacherId: teacherAdminId,
      visibility: Visibility.PUBLISHED,
      courseType: CourseType.OFFLINE,
    },
    create: {
      code: `DEV-MATH-S${i + 1}`,
      title: `${DEV_SEED_MARKER} Toán ${grade} - Lớp phát triển ${i + 1}`,
      academicYear: '2026-2027',
      grade,
      subjectId: 1,
      priceVND: 0,
      teacherId: teacherAdminId,
      visibility: Visibility.PUBLISHED,
      courseType: CourseType.OFFLINE,
    },
  })

  const courseClassData = {
    courseId: course.courseId,
    className: `${DEV_SEED_MARKER} Lớp Toán ${grade} - PH 0392923661 (#${i + 1})`,
    startDate: d(2026, 8, 1),
    endDate: d(2026, 12, 31),
    weeklySchedule: 'Thứ 2, 4, 6 - 18:30',
    room: `P.${101 + i}`,
    instructorId: teacherAdminId,
  }
  await prisma.courseClass.upsert({
    where: { classId: classId(i) },
    update: courseClassData,
    create: { classId: classId(i), ...courseClassData },
  })

  await prisma.courseEnrollment.upsert({
    where: { courseId_studentId: { courseId: course.courseId, studentId: student.studentId } },
    update: { status: CourseEnrollmentStatus.ACTIVE, isPaidFull: true },
    create: {
      courseId: course.courseId,
      studentId: student.studentId,
      enrolledAt: d(2026, 8, 1),
      status: CourseEnrollmentStatus.ACTIVE,
      type: CourseEnrollmentType.MANUAL,
      isPaidFull: true,
    },
  })

  await prisma.classStudent.upsert({
    where: { classId_studentId: { classId: classId(i), studentId: student.studentId } },
    update: {},
    create: { classId: classId(i), studentId: student.studentId },
  })

  const lessonTitles = [
    'Ôn tập đầu năm',
    'Các phép toán cơ bản',
    'Hình học phẳng',
    'Giải phương trình đơn giản',
  ]
  const lessonIds: number[] = []
  for (let l = 0; l < 4; l++) {
    const lessonData = {
      courseId: course.courseId,
      title: `${DEV_SEED_MARKER} Bài ${l + 1}: ${lessonTitles[l]}`,
      description: `${DEV_SEED_MARKER} Nội dung bài học ${l + 1} của lớp Toán ${grade}.`,
      visibility: Visibility.PUBLISHED,
      orderInCourse: l + 1,
      teacherId: teacherAdminId,
    }
    await prisma.lesson.upsert({
      where: { lessonId: lessonId(i, l) },
      update: lessonData,
      create: { lessonId: lessonId(i, l), ...lessonData },
    })
    lessonIds.push(lessonId(i, l))

    await prisma.courseClassLesson.upsert({
      where: { classId_lessonId: { classId: classId(i), lessonId: lessonId(i, l) } },
      update: { displayOrder: l + 1, isVisible: true },
      create: { classId: classId(i), lessonId: lessonId(i, l), displayOrder: l + 1, isVisible: true },
    })

    const chapterA = CHAPTER_POOL[(l * 2) % CHAPTER_POOL.length]
    const chapterB = CHAPTER_POOL[(l * 2 + 1) % CHAPTER_POOL.length]
    for (const chapterId of [chapterA, chapterB]) {
      await prisma.lessonChapter.upsert({
        where: { lessonId_chapterId: { lessonId: lessonId(i, l), chapterId } },
        update: {},
        create: { lessonId: lessonId(i, l), chapterId },
      })
    }
  }

  // ---------------------------------------------------------------------
  // Exam + Sections + Questions + Statements
  // ---------------------------------------------------------------------
  const exam = await prisma.exam.upsert({
    where: { slug: `dev-seed-exam-student-${i + 1}` },
    update: {
      title: `${DEV_SEED_MARKER} Đề kiểm tra Toán - Học sinh ${i + 1}`,
      grade,
      subjectId: 1,
      visibility: ExamVisibility.PUBLISHED,
    },
    create: {
      title: `${DEV_SEED_MARKER} Đề kiểm tra Toán - Học sinh ${i + 1}`,
      slug: `dev-seed-exam-student-${i + 1}`,
      description: `${DEV_SEED_MARKER} Đề thi tổng hợp dùng cho dữ liệu phát triển.`,
      grade,
      subjectId: 1,
      createdBy: teacherAdminId,
      visibility: ExamVisibility.PUBLISHED,
      typeOfExam: TypeOfExam.OT,
    },
  })

  const sectionIds: number[] = []
  for (const sectionDef of SECTION_DEFS) {
    const section = await prisma.section.upsert({
      where: { examId_order: { examId: exam.examId, order: sectionDef.order } },
      update: { title: sectionDef.title },
      create: { examId: exam.examId, title: sectionDef.title, order: sectionDef.order },
    })
    sectionIds.push(section.sectionId)
  }

  const questionIds: number[] = []
  const questionMax: number[] = []
  const questionStatementIds: number[][] = []
  for (let q = 0; q < QUESTION_BANK.length; q++) {
    const def = QUESTION_BANK[q]
    const question = await prisma.question.upsert({
      where: { slug: `dev-seed-question-student-${i + 1}-${q + 1}` },
      update: {
        content: def.content,
        type: def.type,
        difficulty: def.difficulty,
        pointsOrigin: def.pointsOrigin,
        correctAnswer: def.correctAnswer ?? null,
        solution: def.solution,
        visibility: Visibility.PUBLISHED,
      },
      create: {
        content: def.content,
        slug: `dev-seed-question-student-${i + 1}-${q + 1}`,
        type: def.type,
        difficulty: def.difficulty,
        pointsOrigin: def.pointsOrigin,
        correctAnswer: def.correctAnswer ?? null,
        solution: def.solution,
        grade,
        subjectId: 1,
        visibility: Visibility.PUBLISHED,
        createdBy: teacherAdminId,
      },
    })
    questionIds.push(question.questionId)
    questionMax.push(def.pointsOrigin)

    const statementIds: number[] = []
    if (def.statements) {
      for (let s = 0; s < def.statements.length; s++) {
        const stDef = def.statements[s]
        const stData = {
          content: `${DEV_SEED_MARKER} ${stDef.content}`,
          questionId: question.questionId,
          isCorrect: stDef.isCorrect,
          order: s + 1,
        }
        await prisma.statement.upsert({
          where: { statementId: statementId(i, q, s) },
          update: stData,
          create: { statementId: statementId(i, q, s), ...stData },
        })
        statementIds.push(statementId(i, q, s))
      }
    }
    questionStatementIds.push(statementIds)

    const sectionIndex = SECTION_DEFS.findIndex((sec) => sec.questionIndexes.includes(q))
    const orderInSection = SECTION_DEFS[sectionIndex].questionIndexes.indexOf(q) + 1
    await prisma.questionExam.upsert({
      where: { questionId_examId: { questionId: question.questionId, examId: exam.examId } },
      update: { sectionId: sectionIds[sectionIndex], order: orderInSection },
      create: { questionId: question.questionId, examId: exam.examId, sectionId: sectionIds[sectionIndex], order: orderInSection },
    })

    const chapterId = CHAPTER_POOL[q % CHAPTER_POOL.length]
    await prisma.questionChapter.upsert({
      where: { questionId_chapterId: { questionId: question.questionId, chapterId } },
      update: {},
      create: { questionId: question.questionId, chapterId },
    })
  }

  // ---------------------------------------------------------------------
  // Exam attempt trực tiếp (không qua Competition)
  // ---------------------------------------------------------------------
  const examAnswers = distributePoints(questionMax, 0.785)
  const examAttemptData = {
    examId: exam.examId,
    studentId: student.studentId,
    score: 7.85,
    startedAt: d(2026, 9, 1, 8, 0),
    endAt: d(2026, 9, 1, 9, 15),
    gradedAt: d(2026, 9, 2, 10, 0),
    status: ExamAttemptStatus.SUBMITTED,
    duration: 75,
    points: 7.85,
    maxPoints: 10,
    graderId: teacherAdminId,
    feedback: `${DEV_SEED_MARKER} Bài làm tốt, cần rèn thêm phần tự luận.`,
  }
  await prisma.examAttempt.upsert({
    where: { attemptId: examAttemptId(i) },
    update: examAttemptData,
    create: { attemptId: examAttemptId(i), ...examAttemptData },
  })

  for (let q = 0; q < QUESTION_BANK.length; q++) {
    const awarded = examAnswers[q]
    const payload = buildAnswerPayload(QUESTION_BANK[q], questionStatementIds[q], awarded, questionMax[q])
    const qaData = {
      attemptId: examAttemptId(i),
      questionId: questionIds[q],
      answer: payload.answer,
      selectedStatementIds: payload.selectedStatementIds ?? Prisma.DbNull,
      isCorrect: payload.isCorrect,
      points: awarded,
      maxPoints: questionMax[q],
      timeSpentSeconds: 120 + q * 30,
    }
    await prisma.questionAnswer.upsert({
      where: { questionAnswerId: questionAnswerId(i, q) },
      update: qaData,
      create: { questionAnswerId: questionAnswerId(i, q), ...qaData },
    })
  }

  // ---------------------------------------------------------------------
  // Competitions (7 gắn homework + 1 độc lập)
  // ---------------------------------------------------------------------
  const competitionTitles = [
    'Cuộc thi tuần 1',
    'Cuộc thi tuần 2',
    'Cuộc thi tuần 3 (nộp muộn)',
    'Cuộc thi tuần 4 (chưa chấm)',
    'Cuộc thi nhân đôi điểm',
    'Cuộc thi điểm tuyệt đối',
    'Cuộc thi tuần 7',
    'Cuộc thi tự luyện độc lập',
  ]
  const competitionIds: number[] = []
  for (let c = 0; c < 8; c++) {
    const compData = {
      examId: exam.examId,
      title: `${DEV_SEED_MARKER} ${competitionTitles[c]} - HS ${i + 1}`,
      subtitle: 'Dữ liệu phát triển tự động',
      startDate: d(2026, 8, 1),
      endDate: d(2026, 11, 30),
      createdBy: teacherAdminId,
      visibility: Visibility.PUBLISHED,
      durationMinutes: 60,
      maxAttempts: c === 7 ? null : 1,
      showResultDetail: true,
      allowLeaderboard: false,
      allowViewScore: true,
      allowViewAnswer: false,
      enableAntiCheating: false,
    }
    const competition = await prisma.competition.upsert({
      where: { competitionId: competitionId(i, c) },
      update: compData,
      create: { competitionId: competitionId(i, c), ...compData },
    })
    competitionIds.push(competition.competitionId)
  }

  // ---------------------------------------------------------------------
  // LearningItem (12 HOMEWORK + 1 DOCUMENT + 1 YOUTUBE + 1 VIDEO)
  // ---------------------------------------------------------------------
  const homeworkContentIds: number[] = []
  for (const item of HOMEWORK_PLAN) {
    const learningItemData = {
      type: LearningItemType.HOMEWORK,
      title: `${DEV_SEED_MARKER} Bài tập ${item.n + 1} - HS ${i + 1}`,
      description: `${DEV_SEED_MARKER} Bài tập ${item.kind === HomeworkContentType.COMPETITION ? 'dạng cuộc thi' : 'dạng nộp file'}.`,
      createdBy: teacherAdminId,
    }
    await prisma.learningItem.upsert({
      where: { learningItemId: learningItemId(i, item.n) },
      update: learningItemData,
      create: { learningItemId: learningItemId(i, item.n), ...learningItemData },
    })

    const homeworkContentData = {
      learningItemId: learningItemId(i, item.n),
      type: item.kind,
      content:
        item.kind === HomeworkContentType.COMPETITION
          ? `${DEV_SEED_MARKER} Hoàn thành bài thi trắc nghiệm và nộp bài trước hạn.`
          : `${DEV_SEED_MARKER} Chụp ảnh bài làm và tải file lên hệ thống.`,
      dueDate: item.dueDate,
      competitionId: item.compIndex !== null ? competitionIds[item.compIndex] : null,
      allowLateSubmit: item.allowLateSubmit,
      updatePointsOnLateSubmit: item.updatePointsOnLateSubmit,
    }
    await prisma.homeworkContent.upsert({
      where: { homeworkContentId: homeworkContentId(i, item.n) },
      update: homeworkContentData,
      create: { homeworkContentId: homeworkContentId(i, item.n), ...homeworkContentData },
    })
    homeworkContentIds.push(homeworkContentId(i, item.n))

    await prisma.lessonLearningItem.upsert({
      where: { lessonId_learningItemId: { lessonId: lessonIds[item.n % 4], learningItemId: learningItemId(i, item.n) } },
      update: { order: Math.floor(item.n / 4) + 1 },
      create: {
        lessonId: lessonIds[item.n % 4],
        learningItemId: learningItemId(i, item.n),
        order: Math.floor(item.n / 4) + 1,
      },
    })

    const isLearned = item.n < 9
    await prisma.studentLearningItem.upsert({
      where: { studentId_learningItemId: { studentId: student.studentId, learningItemId: learningItemId(i, item.n) } },
      update: { isLearned, learnedAt: isLearned ? item.submitAt : null },
      create: {
        studentId: student.studentId,
        learningItemId: learningItemId(i, item.n),
        isLearned,
        learnedAt: isLearned ? item.submitAt : null,
      },
    })
  }

  const extraItems: Array<{ n: number; type: LearningItemType; title: string }> = [
    { n: 12, type: LearningItemType.DOCUMENT, title: 'Tài liệu tổng hợp công thức Toán học' },
    { n: 13, type: LearningItemType.YOUTUBE, title: 'Video hướng dẫn giải bài tập' },
    { n: 14, type: LearningItemType.VIDEO, title: 'Video bài giảng ghi hình' },
  ]
  for (const extra of extraItems) {
    const learningItemData = {
      type: extra.type,
      title: `${DEV_SEED_MARKER} ${extra.title} - HS ${i + 1}`,
      description: `${DEV_SEED_MARKER} Học liệu bổ trợ cho lớp Toán ${grade}.`,
      createdBy: teacherAdminId,
    }
    await prisma.learningItem.upsert({
      where: { learningItemId: learningItemId(i, extra.n) },
      update: learningItemData,
      create: { learningItemId: learningItemId(i, extra.n), ...learningItemData },
    })

    if (extra.type === LearningItemType.DOCUMENT) {
      const contentData = { learningItemId: learningItemId(i, extra.n), content: `${DEV_SEED_MARKER} Nội dung tài liệu tổng hợp.`, orderInDocument: 1 }
      await prisma.documentContent.upsert({
        where: { documentContentId: documentContentId(i) },
        update: contentData,
        create: { documentContentId: documentContentId(i), ...contentData },
      })
    } else if (extra.type === LearningItemType.YOUTUBE) {
      const contentData = {
        learningItemId: learningItemId(i, extra.n),
        content: `${DEV_SEED_MARKER} Video hướng dẫn giải bài tập trên lớp.`,
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }
      await prisma.youtubeContent.upsert({
        where: { youtubeContentId: youtubeContentId(i) },
        update: contentData,
        create: { youtubeContentId: youtubeContentId(i), ...contentData },
      })
    } else {
      const contentData = { learningItemId: learningItemId(i, extra.n), content: `${DEV_SEED_MARKER} Video bài giảng ghi hình lại buổi học.` }
      await prisma.videoContent.upsert({
        where: { videoContentId: videoContentId(i) },
        update: contentData,
        create: { videoContentId: videoContentId(i), ...contentData },
      })
    }

    await prisma.lessonLearningItem.upsert({
      where: { lessonId_learningItemId: { lessonId: lessonIds[extra.n % 4], learningItemId: learningItemId(i, extra.n) } },
      update: { order: 10 },
      create: { lessonId: lessonIds[extra.n % 4], learningItemId: learningItemId(i, extra.n), order: 10 },
    })

    await prisma.studentLearningItem.upsert({
      where: { studentId_learningItemId: { studentId: student.studentId, learningItemId: learningItemId(i, extra.n) } },
      update: { isLearned: true, learnedAt: d(2026, 8, 5) },
      create: { studentId: student.studentId, learningItemId: learningItemId(i, extra.n), isLearned: true, learnedAt: d(2026, 8, 5) },
    })
  }

  // ---------------------------------------------------------------------
  // CompetitionSubmit cho 7 competition gắn homework + HomeworkSubmit
  // ---------------------------------------------------------------------
  for (const item of HOMEWORK_PLAN) {
    let competitionSubmitId: number | null = null

    if (item.kind === HomeworkContentType.COMPETITION && item.compIndex !== null) {
      const maxPoints = item.maxPointsOverride ?? 10
      const totalPoints = item.ratio === null ? null : roundScore(questionMax.reduce((s, m) => s + m, 0) * (item.maxPointsOverride ? item.maxPointsOverride / 10 : 1) * item.ratio)
      const status = item.graded ? CompetitionSubmitStatus.GRADED : CompetitionSubmitStatus.SUBMITTED
      const submitData = {
        status,
        startedAt: d(item.submitAt.getUTCFullYear(), item.submitAt.getUTCMonth() + 1, item.submitAt.getUTCDate(), 7, 0),
        submittedAt: item.submitAt,
        gradedAt: item.graded ? d(item.submitAt.getUTCFullYear(), item.submitAt.getUTCMonth() + 1, item.submitAt.getUTCDate() + 1) : null,
        totalPoints,
        maxPoints,
        timeSpentSeconds: 3200,
        graderId: item.graded ? teacherAdminId : null,
        feedback: item.feedback,
      }
      const competitionSubmit = await prisma.competitionSubmit.upsert({
        where: {
          competitionId_studentId_attemptNumber: {
            competitionId: competitionIds[item.compIndex],
            studentId: student.studentId,
            attemptNumber: 1,
          },
        },
        update: submitData,
        create: {
          competitionId: competitionIds[item.compIndex],
          studentId: student.studentId,
          attemptNumber: 1,
          ...submitData,
        },
      })
      competitionSubmitId = competitionSubmit.competitionSubmitId

      const scale = item.maxPointsOverride ? item.maxPointsOverride / 10 : 1
      const scaledMax = questionMax.map((m) => m * scale)
      const awards = distributePoints(scaledMax, item.ratio)
      for (let q = 0; q < QUESTION_BANK.length; q++) {
        const payload = buildAnswerPayload(QUESTION_BANK[q], questionStatementIds[q], awards[q], scaledMax[q])
        const caData = {
          competitionSubmitId,
          questionId: questionIds[q],
          answer: payload.answer,
          selectedStatementIds: payload.selectedStatementIds ?? Prisma.DbNull,
          isCorrect: payload.isCorrect,
          points: awards[q],
          maxPoints: scaledMax[q],
          timeSpentSeconds: 90 + q * 20,
        }
        await prisma.competitionAnswer.upsert({
          where: { competitionSubmitId_questionId: { competitionSubmitId, questionId: questionIds[q] } },
          update: caData,
          create: caData,
        })
      }
    }

    const homeworkSubmitData = {
      homeworkContentId: homeworkContentId(i, item.n),
      studentId: student.studentId,
      competitionSubmitId,
      submitAt: item.submitAt,
      content:
        item.kind === HomeworkContentType.COMPETITION
          ? `${DEV_SEED_MARKER} Bài làm nộp qua cuộc thi (attempt 1).`
          : `${DEV_SEED_MARKER} Đã nộp file bài làm scan (dev fixture).`,
      points: item.kind === HomeworkContentType.FILE_UPLOAD ? item.filePoints : null,
      gradedAt: item.graded
        ? d(item.submitAt.getUTCFullYear(), item.submitAt.getUTCMonth() + 1, item.submitAt.getUTCDate() + 1)
        : null,
      graderId: item.graded ? teacherAdminId : null,
      feedback: item.feedback,
    }
    await prisma.homeworkSubmit.upsert({
      where: { homeworkContentId_studentId: { homeworkContentId: homeworkContentId(i, item.n), studentId: student.studentId } },
      update: homeworkSubmitData,
      create: homeworkSubmitData,
    })
  }

  // Chỉ homework dạng COMPETITION với maxPoints=10 mới được thống kê theo đúng
  // business rule của ParentStudentResultsReadService; FILE_UPLOAD không có
  // competitionSubmit nên luôn bị loại khỏi averageScore dù vẫn tính vào totalSubmissions.
  let homeworkScoredSum = 0
  let homeworkScoredCount = 0
  for (const item of HOMEWORK_PLAN) {
    if (item.kind !== HomeworkContentType.COMPETITION || item.compIndex === null) continue
    const maxPoints = item.maxPointsOverride ?? 10
    if (maxPoints !== 10 || item.ratio === null) continue
    const totalPoints = roundScore(questionMax.reduce((s, m) => s + m, 0) * item.ratio)
    homeworkScoredSum += totalPoints
    homeworkScoredCount += 1
  }

  // ---------------------------------------------------------------------
  // Competition độc lập (14 attempts, 12 hợp lệ trong Parent Results)
  // ---------------------------------------------------------------------
  const standaloneCompetitionId = competitionIds[7]
  let standaloneScoredSum = 0
  let standaloneScoredCount = 0
  let standaloneVisible = 0

  for (const attempt of STANDALONE_PLAN) {
    const totalPoints = attempt.ratio === null ? null : roundScore(questionMax.reduce((s, m) => s + m, 0) * attempt.ratio)
    const maxPoints = attempt.status === CompetitionSubmitStatus.IN_PROGRESS || attempt.status === CompetitionSubmitStatus.ABANDONED ? null : 10
    const startedAt =
      attempt.submittedAt !== null
        ? d(attempt.submittedAt.getUTCFullYear(), attempt.submittedAt.getUTCMonth() + 1, attempt.submittedAt.getUTCDate(), 7, 0)
        : d(2026, 10, 20, 7, 0)
    const submitData = {
      status: attempt.status,
      startedAt,
      submittedAt: attempt.submittedAt,
      gradedAt: attempt.status === CompetitionSubmitStatus.GRADED ? d(attempt.submittedAt!.getUTCFullYear(), attempt.submittedAt!.getUTCMonth() + 1, attempt.submittedAt!.getUTCDate() + 1) : null,
      totalPoints,
      maxPoints,
      timeSpentSeconds: attempt.submittedAt ? 3400 : null,
      graderId: attempt.status === CompetitionSubmitStatus.GRADED ? teacherAdminId : null,
      feedback:
        attempt.status === CompetitionSubmitStatus.GRADED ? `${DEV_SEED_MARKER} Kết quả lượt thi #${attempt.attemptNumber}.` : null,
    }
    const competitionSubmit = await prisma.competitionSubmit.upsert({
      where: {
        competitionId_studentId_attemptNumber: {
          competitionId: standaloneCompetitionId,
          studentId: student.studentId,
          attemptNumber: attempt.attemptNumber,
        },
      },
      update: submitData,
      create: {
        competitionId: standaloneCompetitionId,
        studentId: student.studentId,
        attemptNumber: attempt.attemptNumber,
        ...submitData,
      },
    })

    if (attempt.status === CompetitionSubmitStatus.GRADED || attempt.status === CompetitionSubmitStatus.SUBMITTED) {
      standaloneVisible += 1
    }
    if (attempt.status === CompetitionSubmitStatus.GRADED && totalPoints !== null) {
      standaloneScoredSum += totalPoints
      standaloneScoredCount += 1
    }

    if (attempt.hasAnswers) {
      const awards = distributePoints(questionMax, attempt.ratio)
      for (let q = 0; q < QUESTION_BANK.length; q++) {
        const payload = buildAnswerPayload(QUESTION_BANK[q], questionStatementIds[q], awards[q], questionMax[q])
        const caData = {
          competitionSubmitId: competitionSubmit.competitionSubmitId,
          questionId: questionIds[q],
          answer: payload.answer,
          selectedStatementIds: payload.selectedStatementIds ?? Prisma.DbNull,
          isCorrect: payload.isCorrect,
          points: awards[q],
          maxPoints: questionMax[q],
          timeSpentSeconds: 80 + q * 15,
        }
        await prisma.competitionAnswer.upsert({
          where: { competitionSubmitId_questionId: { competitionSubmitId: competitionSubmit.competitionSubmitId, questionId: questionIds[q] } },
          update: caData,
          create: caData,
        })
      }
    }
  }

  // ---------------------------------------------------------------------
  // ClassSession + Attendance (Aug-Oct 2026)
  // ---------------------------------------------------------------------
  const sessionDates = [
    d(2026, 8, 3),
    d(2026, 8, 10),
    d(2026, 8, 17),
    d(2026, 8, 24),
    d(2026, 8, 31),
    d(2026, 9, 7),
    d(2026, 9, 14),
    d(2026, 9, 21),
    d(2026, 9, 28),
    d(2026, 10, 5),
  ]
  const attendanceCycle = [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP]
  for (let s = 0; s < sessionDates.length; s++) {
    const sessionData = {
      name: `${DEV_SEED_MARKER} Buổi học ${s + 1} - Lớp Toán ${grade} HS${i + 1}`,
      classId: classId(i),
      homeworkId: s === 2 ? homeworkContentIds[7] : s === 6 ? homeworkContentIds[8] : null,
      sessionDate: sessionDates[s],
      startTime: d(2026, 1, 1, 18, 30),
      endTime: d(2026, 1, 1, 20, 0),
    }
    await prisma.classSession.upsert({
      where: { sessionId: sessionId(i, s) },
      update: sessionData,
      create: { sessionId: sessionId(i, s), ...sessionData },
    })

    const status = attendanceCycle[s % attendanceCycle.length]
    const attendanceData = {
      sessionId: sessionId(i, s),
      studentId: student.studentId,
      status,
      markedAt: sessionDates[s],
      markerId: teacherAdminId,
      notes: status === AttendanceStatus.MAKEUP ? `${DEV_SEED_MARKER} Học bù cho buổi trước.` : null,
    }
    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId: sessionId(i, s), studentId: student.studentId } },
      update: attendanceData,
      create: attendanceData,
    })
  }

  return {
    studentId: student.studentId,
    fullName: student.fullName,
    grade,
    username: `dev.student.parent.0392923661${i === 0 ? '' : `.0${i + 1}`}`,
    courseCode: course.code,
    examSlug: exam.slug ?? '',
    homeworkSubmits: HOMEWORK_PLAN.length,
    homeworkScored: homeworkScoredCount,
    homeworkAvgExpected: homeworkScoredCount > 0 ? roundScore(homeworkScoredSum / homeworkScoredCount) : null,
    standaloneTotal: STANDALONE_PLAN.length,
    standaloneVisible,
    standaloneScored: standaloneScoredCount,
    standaloneAvgExpected: standaloneScoredCount > 0 ? roundScore(standaloneScoredSum / standaloneScoredCount) : null,
  }
}

async function verifyPostConditions(prisma: PrismaClient, summaries: StudentSeedSummary[]): Promise<void> {
  for (const summary of summaries) {
    const homeworkCount = await prisma.homeworkSubmit.count({ where: { studentId: summary.studentId } })
    if (homeworkCount !== 12) {
      throw new Error(`Post-condition thất bại: học sinh ${summary.studentId} có ${homeworkCount} homework submit, kỳ vọng 12.`)
    }

    const standaloneVisibleCount = await prisma.competitionSubmit.count({
      where: {
        studentId: summary.studentId,
        homeworkSubmit: null,
        status: { in: [CompetitionSubmitStatus.SUBMITTED, CompetitionSubmitStatus.GRADED] },
      },
    })
    if (standaloneVisibleCount !== 12) {
      throw new Error(
        `Post-condition thất bại: học sinh ${summary.studentId} có ${standaloneVisibleCount} standalone competition result, kỳ vọng 12.`,
      )
    }

    const invisibleCount = await prisma.competitionSubmit.count({
      where: {
        studentId: summary.studentId,
        homeworkSubmit: null,
        status: { in: [CompetitionSubmitStatus.IN_PROGRESS, CompetitionSubmitStatus.ABANDONED] },
      },
    })
    if (invisibleCount !== 2) {
      throw new Error(
        `Post-condition thất bại: học sinh ${summary.studentId} có ${invisibleCount} lượt IN_PROGRESS/ABANDONED, kỳ vọng 2.`,
      )
    }
  }
}

export async function seedDevAcademicData(
  prisma: PrismaClient,
  parentFixture: DevParentFixtureContext,
  teacherAdminIds: number[],
): Promise<void> {
  console.log('📊 Seeding dữ liệu học tập cho 4 học sinh (dev fixture)...')

  const studentIndexes = parentFixture.students.map((s) => s.index)
  const preflightSpecs = await buildPreflightSpecs(prisma, studentIndexes)
  await runPreflight(prisma, preflightSpecs)

  const summaries: StudentSeedSummary[] = []
  for (const student of parentFixture.students) {
    const teacherAdminId = teacherAdminIds[student.index % teacherAdminIds.length]
    const summary = await seedStudentAcademicData(prisma, student, teacherAdminId)
    summaries.push(summary)
  }

  await verifyPostConditions(prisma, summaries)

  console.log('✅ Dữ liệu học tập dev fixture đã sẵn sàng.')
  console.table(
    summaries.map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      grade: s.grade,
      course: s.courseCode,
      homeworkSubmits: s.homeworkSubmits,
      homeworkScored: s.homeworkScored,
      homeworkAvgExpected: s.homeworkAvgExpected,
      standaloneVisible: s.standaloneVisible,
      standaloneScored: s.standaloneScored,
      standaloneAvgExpected: s.standaloneAvgExpected,
    })),
  )
}
