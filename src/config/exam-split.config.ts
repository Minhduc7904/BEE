import { registerAs } from '@nestjs/config';

export const ExamSplitConfig = registerAs('examSplit', () => ({
  maxContentLength: parseInt(process.env.EXAM_SPLIT_MAX_CONTENT_LENGTH || '15000', 10),
}));

export default ExamSplitConfig;
