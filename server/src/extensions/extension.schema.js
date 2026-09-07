const { z } = require('zod');

const extensionSchema = z.object({
  examFormId: z.string().trim().min(1).max(20),
  caseType: z.enum(['Thường', 'Đặc biệt']),
  newScheduleId: z.string().trim().min(1).max(20),
}).strict();

module.exports = { extensionSchema };
