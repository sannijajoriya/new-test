
'use server';
/**
 * @fileOverview An AI-powered study assistant bot.
 *
 * - askSarthiBot - A function that acts as a study assistant.
 * - SarthiBotInput - The input type for the function.
 * - SarthiBotOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatHistorySchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string().optional(),
        media: z.object({
            url: z.string(),
            contentType: z.string().optional(),
        }).optional(),
    }))
});

const TrainingDataSchema = z.object({
    question: z.string(),
    answer: z.string(),
});

const SarthiBotInputSchema = z.object({
  text: z.string().describe('The user\'s question or message.'),
  photoDataUri: z.string().optional().describe(
      "An optional photo of a problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  history: z.array(ChatHistorySchema).optional().describe('The previous conversation history.'),
  trainingData: z.array(TrainingDataSchema).optional().describe('A list of question-answer pairs for fine-tuning.'),
  botName: z.string().optional().describe("The bot's name."),
  baseSystemPrompt: z.string().optional().describe("The base system prompt for the bot."),
});
export type SarthiBotInput = z.infer<typeof SarthiBotInputSchema>;

const SarthiBotOutputSchema = z.object({
  response: z.string().describe("The bot's response in simple Hindi."),
});
export type SarthiBotOutput = z.infer<typeof SarthiBotOutputSchema>;

export async function askSarthiBot(input: SarthiBotInput): Promise<SarthiBotOutput> {
  return sarthiBotFlow(input);
}

const defaultSystemPrompt = `You are a friendly, encouraging, and intelligent AI study assistant for students in India who are preparing for competitive exams. Your primary goal is to help students with their questions in a clear and simple manner.

IMPORTANT INSTRUCTIONS:
1.  **ALWAYS respond in simple, conversational Hindi.** Use Devanagari script.
2.  Be encouraging and positive in your tone. Start with a friendly greeting like "नमस्ते!" or "ज़रूर, मैं इसमें आपकी मदद कर सकता हूँ!".
3.  If the user asks a question, provide a clear, step-by-step answer.
4.  If the user uploads an image, analyze it as the main part of their question. For example, it might be a math problem or a diagram.
5.  If the user asks for motivation, provide a short, inspiring quote in Hindi.
6.  Keep your answers concise and easy to understand. Avoid very complex or technical Hindi words.`;


const sarthiBotFlow = ai.defineFlow(
  {
    name: 'sarthiBotFlow',
    inputSchema: SarthiBotInputSchema,
    outputSchema: SarthiBotOutputSchema,
  },
  async (input) => {

    const botName = input.botName || 'UdaanSarthi Bot';
    let systemPrompt = input.baseSystemPrompt || defaultSystemPrompt;
    systemPrompt = systemPrompt.replace(/UdaanSarthi Bot/g, botName);

    if (input.trainingData && input.trainingData.length > 0) {
        const trainingBlock = input.trainingData.map(d => `Q: ${d.question}\nA: ${d.answer}`).join('\n\n');
        systemPrompt += `\n\nHere is some specific information you MUST use to answer questions. If the user asks something similar to one of these questions, you should provide the given answer:\n${trainingBlock}`;
    }
    
    const userMessageContent: any[] = [{ text: input.text }];
    if (input.photoDataUri) {
        userMessageContent.push({ media: { url: input.photoDataUri } });
    }

    const messages = [
        ...(input.history || []),
        { role: 'user' as const, content: userMessageContent }
    ];

    const {output} = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        system: systemPrompt,
        messages: messages,
        output: {
            schema: SarthiBotOutputSchema,
        }
    });
    
    if (!output) {
        return { response: "माफ़ कीजिए, मुझे समझ नहीं आया। क्या आप कृपया अपना प्रश्न दोहरा सकते हैं?" };
    }
    return output;
  }
);
