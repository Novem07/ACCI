const { z } = require('zod');

const assignmentSchema = z.object({
  candidateId: z.string().trim().min(1).max(20),
  scheduleId: z.string().trim().min(1).max(20),
}).strict();

const issueExamFormsSchema = z.object({
  registrationId: z.string().trim().min(1).max(20),
  assignments: z.array(assignmentSchema).min(1).max(100),
}).strict().superRefine((value, context) => {
  const ids = value.assignments.map((assignment) => assignment.candidateId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['assignments'], message: 'Mỗi thí sinh chỉ được gán một lịch thi.' });
  }
});

module.exports = { issueExamFormsSchema };
