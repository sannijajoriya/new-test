'use server';
/**
 * @fileOverview A flow to generate a structured test from a block of text.
 *
 * - generateTestFromText - A function that handles parsing text into test questions.
 * - GenerateTestInput - The input type for the function.
 * - GenerateTestOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestInputSchema = z.object({
  text: z.string().describe('A block of text containing questions, multiple choice options, and correct answers.'),
});
export type GenerateTestInput = z.infer<typeof GenerateTestInputSchema>;

const questionSchema = z.object({
  text: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of at least 2 multiple choice options.'),
  correctAnswer: z.string().describe('The correct answer, which must be one of the options.'),
});

const GenerateTestOutputSchema = z.object({
    questions: z.array(questionSchema).describe("An array of questions parsed from the text."),
});

export type GenerateTestOutput = z.infer<typeof GenerateTestOutputSchema>;

export async function generateTestFromText(input: GenerateTestInput): Promise<GenerateTestOutput> {
  return generateTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestPrompt',
  input: {schema: GenerateTestInputSchema},
  output: {schema: GenerateTestOutputSchema},
  prompt: `You are an expert at parsing and structuring educational content. Your task is to convert a block of raw text into a structured JSON format for a test.

  The user will provide text where each question is numbered (e.g., Q1., 1., Question 1:). Each question will be followed by a list of options, typically labeled with letters (A, B, C, D) or numbers (1, 2, 3, 4).
  The correct answer will be indicated on a new line, like "Answer: C" or "Correct Answer: C". The letter corresponds to the option.

  Example Input 1:
  \`\`\`
  Q1. What is the capital of Rajasthan?
  A. Udaipur
  B. Bikaner
  C. Jaipur
  D. Jodhpur
  Answer: C

  Q2. Who is known as the desert fox of India?
  A. Manekshaw
  B. Cariappa
  C. Thimayya
  D. Erwin Rommel
  Answer: D
  \`\`\`
  
  Example Input 2 (alternative format):
  \`\`\`
  1. What is the capital of France?
  a) London
  b) Berlin
  c) Paris*
  d) Madrid

  2. Which planet is known as the Red Planet?
  a) Venus
  b) Mars*
  c) Jupiter
  d) Saturn
  \`\`\`

  Based on these examples, you must:
  1. Identify each question and its text, ignoring the "Q1." or "1." prefix.
  2. Extract all options for each question. Remove the option label (e.g., "A.", "b)") from the option text.
  3. Identify the correct answer. 
     - If an "Answer: C" format is used, map the letter to the corresponding option text. For "Answer: C" in Example 1, the correct answer is "Jaipur".
     - If an asterisk (*) is used, the option with the asterisk is the correct one. Remove the asterisk from the returned option text.
  4. The value you return for 'correctAnswer' must exactly match one of the option values you extracted.
  5. Format the output as a JSON object containing a list of questions, where each question has 'text', 'options', and 'correctAnswer' fields.

  Now, parse the following text:
  {{{text}}}
  `,
});


const generateTestFlow = ai.defineFlow(
  {
    name: 'generateTestFlow',
    inputSchema: GenerateTestInputSchema,
    outputSchema: GenerateTestOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // The output can be null if the model fails to generate valid JSON.
    // We'll return an empty array of questions in that case to avoid crashing the client.
    if (!output) {
        return { questions: [] };
    }
    return output;
  }
);
