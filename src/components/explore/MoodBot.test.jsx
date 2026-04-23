import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MoodBot from './MoodBot';
import * as aiService from '../../services/aiService';

// Mock the AI Service
vi.mock('../../services/aiService', () => ({
    getGenresFromMood: vi.fn(),
}));

// Mock window.HTMLElement.prototype.scrollIntoView which is called by the bot
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('MoodBot Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset global fetch mock if any
        global.fetch = vi.fn();
    });

    it('Successfully open and close the MoodBot side panel', async () => {
        render(<MoodBot />);
        
        // Panel should be closed initially (Dialog text is not visible)
        expect(screen.queryByText('Close panel')).not.toBeInTheDocument();

        // Open the panel
        const openButton = screen.getByText('MoodBot');
        fireEvent.click(openButton);
        
        // Wait for it to open
        await waitFor(() => {
            expect(screen.getByText('Close panel')).toBeInTheDocument();
        });

        // Close the panel
        const closeButton = screen.getByText('Close panel');
        fireEvent.click(closeButton);
    });

    it('Input field prevents submission when empty', async () => {
        render(<MoodBot />);
        fireEvent.click(screen.getByText('MoodBot')); // Open panel
        
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);

        // Assert nothing was sent by checking messages length
        // We only expect the initial greeting message
        expect(screen.getAllByText(/Hi! I'm MoodBot/i)).toHaveLength(1);
        // There should be no user messages
        expect(screen.queryByText((content, element) => element.classList.contains('bg-purple-600'))).not.toBeInTheDocument();
    });

    it('Chat bubbles correctly format messages as "User" and "Assistant"', async () => {
        aiService.getGenresFromMood.mockResolvedValueOnce({
            friendly_message: "Here you go!",
            genres: [1]
        });
        
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                data: [{ title_english: "Naruto" }]
            })
        });

        render(<MoodBot />);
        fireEvent.click(screen.getByText('MoodBot'));

        const input = screen.getByPlaceholderText('Type your mood...');
        const sendButton = screen.getByText('Send');

        fireEvent.change(input, { target: { value: 'Happy' } });
        fireEvent.click(sendButton);

        // User message should have bg-purple-600 (from the conditional styling)
        await waitFor(() => {
            const userMsg = screen.getByText('Happy');
            expect(userMsg.className).toContain('bg-purple-600');
            expect(userMsg.className).toContain('text-white');
        });

        // Assistant message should have bg-slate-800
        const assistantMsg = screen.getByText(/Hi! I'm MoodBot/i);
        expect(assistantMsg.className).toContain('bg-slate-800');
    });

    it('Appropriate error message displays when AI service fails', async () => {
        aiService.getGenresFromMood.mockRejectedValueOnce(new Error("AI Failed"));

        render(<MoodBot />);
        fireEvent.click(screen.getByText('MoodBot'));

        fireEvent.change(screen.getByPlaceholderText('Type your mood...'), { target: { value: 'Happy' } });
        fireEvent.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(screen.getByText("Sorry, I'm having trouble understanding you. Try rephrasing your request.")).toBeInTheDocument();
        });
    });

    it('Successfully output a mood-based anime recommendation in the chat', async () => {
        aiService.getGenresFromMood.mockResolvedValueOnce({
            friendly_message: "I feel that! Here are some action anime:",
            genres: [1]
        });
        
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                data: [
                    { title_english: "Attack on Titan" },
                    { title_english: "Jujutsu Kaisen" }
                ]
            })
        });

        render(<MoodBot />);
        fireEvent.click(screen.getByText('MoodBot'));

        fireEvent.change(screen.getByPlaceholderText('Type your mood...'), { target: { value: 'Excited' } });
        fireEvent.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(aiService.getGenresFromMood).toHaveBeenCalledWith('Excited');
            expect(global.fetch).toHaveBeenCalled();
            // Verify output contains the titles
            expect(screen.getByText(/Attack on Titan/i)).toBeInTheDocument();
            expect(screen.getByText(/Jujutsu Kaisen/i)).toBeInTheDocument();
        });
    });


});
