// This file is used for local development to ensure Genkit flows are loaded.
// It can be simplified or even removed for production builds if flows are
// directly imported where they are used.

import { config } from 'dotenv';
config();

// The following imports are to ensure the flows are registered with Genkit
// during development. In a production environment, you might handle this
// differently, e.g., by ensuring server components that use flows import
// them directly.
import '@/ai/flows/personalized-feedback.ts';
import '@/ai/flows/generate-test-flow.ts';
import '@/ai/flows/sarthi-bot-flow.ts';
