'use server';

/**
 * @fileOverview Personalized feedback AI agent.
 *
 * - generatePersonalizedFeedback - A function that handles the generation of personalized feedback for a student after a test.
 * - PersonalizedFeedbackInput - The input type for the generatePersonalizedFeedback function.
 * - PersonalizedFeedbackOutput - The return type for the generatePersonalizedFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFeedbackInputSchema = z.object({
  testName: z.string().describe('The name of the test.'),
  studentAnswers: z
    .record(z.string(), z.string())
    .describe('A map of question IDs to the student answers.'),
  correctAnswers: z
    .record(z.string(), z.string())
    .describe('A map of question IDs to the correct answers.'),
  testQuestions: z
    .record(z.string(), z.string())
    .describe('A map of question IDs to the test questions.'),
});
export type PersonalizedFeedbackInput = z.infer<
  typeof PersonalizedFeedbackInputSchema
>;

const PersonalizedFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The personalized feedback for the student.'),
});
export type PersonalizedFeedbackOutput = z.infer<
  typeof PersonalizedFeedbackOutputSchema
>;

export async function generatePersonalizedFeedback(
  input: PersonalizedFeedbackInput
): Promise<PersonalizedFeedbackOutput> {
  return personalizedFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFeedbackPrompt',
  input: {schema: PersonalizedFeedbackInputSchema},
  output: {schema: PersonalizedFeedbackOutputSchema},
  prompt: `You are an AI expert in generating personalized feedback for students after they complete a test.

You will analyze the student's answers, compare them to the correct answers, and identify common errors.
Based on this analysis, you will generate personalized feedback for the student to help them improve their understanding of the concepts tested.

Test Name: {{{testName}}}
Student Answers: {{studentAnswers}}
Correct Answers: {{correctAnswers}}
Test Questions: {{testQuestions}}

Personalized Feedback:`,
});

const personalizedFeedbackFlow = ai.defineFlow(
  {
    name: 'personalizedFeedbackFlow',
    inputSchema: PersonalizedFeedbackInputSchema,
    outputSchema: PersonalizedFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
