// This file is machine-generated - edit at your own risk.

'use server';
/**
 * @fileOverview An AI-powered name generator that suggests creative and relevant names for new teams and tournaments.
 *
 * - generateTeamTournamentName - A function that handles the team/tournament name generation process.
 * - GenerateTeamTournamentNameInput - The input type for the generateTeamTournamentName function.
 * - GenerateTeamTournamentNameOutput - The return type for the generateTeamTournamentName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamTournamentNameInputSchema = z.object({
  type: z.enum(['team', 'tournament']).describe('The type of name to generate (team or tournament).'),
  keywords: z.string().describe('Keywords to inspire the name generation, such as the sport, location, or theme.'),
});
export type GenerateTeamTournamentNameInput = z.infer<typeof GenerateTeamTournamentNameInputSchema>;

const GenerateTeamTournamentNameOutputSchema = z.object({
  name: z.string().describe('The generated name for the team or tournament.'),
  reason: z.string().describe('A brief explanation of why the name is suitable.'),
});
export type GenerateTeamTournamentNameOutput = z.infer<typeof GenerateTeamTournamentNameOutputSchema>;

export async function generateTeamTournamentName(input: GenerateTeamTournamentNameInput): Promise<GenerateTeamTournamentNameOutput> {
  return generateTeamTournamentNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeamTournamentNamePrompt',
  input: {schema: GenerateTeamTournamentNameInputSchema},
  output: {schema: GenerateTeamTournamentNameOutputSchema},
  prompt: `You are a creative name generator for sports teams and tournaments.

  Generate a name based on the following criteria:
  - Type: {{{type}}}
  - Keywords: {{{keywords}}}

  The name should be engaging, relevant, and resonate with the spirit of the game.
  Also provide a brief reason why the name is suitable.
  `,
});

const generateTeamTournamentNameFlow = ai.defineFlow(
  {
    name: 'generateTeamTournamentNameFlow',
    inputSchema: GenerateTeamTournamentNameInputSchema,
    outputSchema: GenerateTeamTournamentNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
