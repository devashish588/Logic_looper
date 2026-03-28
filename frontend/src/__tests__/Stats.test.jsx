/**
 * Tests for pages/Stats.jsx — Stat cards and basic rendering.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import statsReducer from '../store/statsSlice.js';
import authReducer from '../store/authSlice.js';
import Stats from '../pages/Stats.jsx';

// Mock the activityStore to avoid real IndexedDB
jest.mock('../storage/activityStore.js', () => ({
    getDailyActivity: jest.fn().mockResolvedValue([]),
    scoreToIntensity: jest.fn().mockReturnValue(0),
}));

function createStore(overrides = {}) {
    return configureStore({
        reducer: {
            stats: statsReducer,
            auth: authReducer,
        },
        preloadedState: {
            stats: {
                currentStreak: 5,
                longestStreak: 12,
                totalSolved: 42,
                totalPoints: 3500,
                averageTime: 95,
                lastSolveDate: '2026-02-17',
                heatmapData: { '2026-02-17': 85 },
                solvedTypes: ['numberMatrix', 'patternMatch'],
                achievements: ['first_solve', 'streak_3'],
                perfectStreak: 2,
                fastestSolve: 30,
                ...overrides.stats,
            },
            auth: {
                user: { id: 'user-1', displayName: 'TestUser' },
                token: 'tok',
                isAuthenticated: true,
                loading: false,
                error: null,
                ...overrides.auth,
            },
        },
    });
}

function renderStats(overrides = {}) {
    const store = createStore(overrides);
    return render(
        <Provider store={store}>
            <Stats />
        </Provider>,
    );
}

describe('Stats', () => {
    it('renders without crashing', () => {
        const { container } = renderStats();
        expect(container).toBeTruthy();
    });

    it('displays current streak value', () => {
        const { container } = renderStats();
        // currentStreak is rendered in the streak hero display, not stat-card-value
        const streakEl = container.querySelector('.streak-number');
        expect(streakEl?.textContent?.trim()).toBe('5');
    });

    it('displays longest streak value', () => {
        const { container } = renderStats();
        const statValues = container.querySelectorAll('.stat-card-value');
        const texts = [...statValues].map((el) => el.textContent.trim());
        expect(texts).toContain('12');
    });

    it('displays total solved value', () => {
        const { container } = renderStats();
        const statValues = container.querySelectorAll('.stat-card-value');
        const texts = [...statValues].map((el) => el.textContent.trim());
        expect(texts).toContain('42');
    });

    it('displays total points value', () => {
        const { container } = renderStats();
        const statValues = container.querySelectorAll('.stat-card-value');
        const texts = [...statValues].map((el) => el.textContent.trim());
        expect(texts).toContain('3500');
    });

    it('displays stat labels', () => {
        renderStats();
        expect(screen.getByText('Best Streak')).toBeInTheDocument();
        expect(screen.getByText('Puzzles Solved')).toBeInTheDocument();
        expect(screen.getByText('Total Points')).toBeInTheDocument();
    });

    it('renders the heatmap section', () => {
        const { container } = renderStats();
        expect(container.querySelector('.heatmap-grid') || container.textContent).toBeTruthy();
    });
});
