/**
 * Tests for pages/Home.jsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import statsReducer from '../store/statsSlice.js';
import authReducer from '../store/authSlice.js';

// Mock react-router-dom to avoid ESM transform issue with react-router-dom v7
jest.mock('react-router-dom', () => {
    const R = require('react');
    return {
        MemoryRouter: ({ children }) => R.createElement(R.Fragment, null, children),
        Link: ({ to, children, ...props }) => R.createElement('a', { href: to, ...props }, children),
        useNavigate: () => jest.fn(),
        useLocation: () => ({ pathname: '/' }),
        NavLink: ({ to, children, ...props }) => R.createElement('a', { href: to, ...props }, children),
    };
});

import Home from '../pages/Home.jsx';
import { MemoryRouter } from 'react-router-dom';

// Mock generator to avoid async dynamic imports
jest.mock('../engine/generator.js', () => ({
    getTodayDateString: () => '2026-02-17',
    getPuzzleTypeForDate: () => 'numberMatrix',
    generatePuzzle: jest.fn(),
}));

function createStore(overrides = {}) {
    return configureStore({
        reducer: {
            stats: statsReducer,
            auth: authReducer,
        },
        preloadedState: {
            stats: {
                currentStreak: 3,
                longestStreak: 7,
                totalSolved: 15,
                totalPoints: 1200,
                averageTime: 90,
                lastSolveDate: null,
                heatmapData: {},
                solvedTypes: [],
                achievements: [],
                perfectStreak: 0,
                fastestSolve: null,
                ...overrides.stats,
            },
            auth: {
                user: { displayName: 'TestUser' },
                token: 'tok',
                isAuthenticated: true,
                loading: false,
                error: null,
                ...overrides.auth,
            },
        },
    });
}

function renderHome(overrides = {}) {
    const store = createStore(overrides);
    return render(
        <Provider store={store}>
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        </Provider>,
    );
}

describe('Home', () => {
    it('renders the welcome greeting with user name', () => {
        renderHome();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('renders fallback greeting when user has no displayName', () => {
        renderHome({ auth: { user: {} } });
        expect(screen.getByText('Logician')).toBeInTheDocument();
    });

    it('shows today\'s puzzle type label', () => {
        renderHome();
        expect(screen.getByText('Number Matrix')).toBeInTheDocument();
    });

    it('shows "Today\'s Challenge" badge', () => {
        renderHome();
        expect(screen.getByText("Today's Challenge")).toBeInTheDocument();
    });

    it('shows "Start Today\'s Challenge" link when not solved', () => {
        renderHome();
        expect(screen.getByText("Start Today's Challenge")).toBeInTheDocument();
    });

    it('shows "Challenge Complete" when today is solved', () => {
        renderHome({ stats: { heatmapData: { '2026-02-17': 85 } } });
        expect(screen.getByText(/Challenge Complete/)).toBeInTheDocument();
    });

    it('displays quick stats', () => {
        renderHome();
        expect(screen.getByText('3')).toBeInTheDocument(); // currentStreak
        expect(screen.getByText('15')).toBeInTheDocument(); // totalSolved
        expect(screen.getByText('1200')).toBeInTheDocument(); // totalPoints
        expect(screen.getByText('7')).toBeInTheDocument(); // longestStreak
    });

    it('displays stat labels', () => {
        renderHome();
        expect(screen.getByText('Current Streak')).toBeInTheDocument();
        expect(screen.getByText('Puzzles Solved')).toBeInTheDocument();
        expect(screen.getByText('Total Points')).toBeInTheDocument();
        expect(screen.getByText('Best Streak')).toBeInTheDocument();
    });
});
