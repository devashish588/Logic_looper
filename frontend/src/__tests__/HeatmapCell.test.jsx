/**
 * Tests for components/HeatmapCell.jsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeatmapCell from '../components/HeatmapCell.jsx';

describe('HeatmapCell', () => {
    const baseProps = {
        date: '2026-02-17',
        score: 85,
        intensity: 3,
        puzzleType: 'numberMatrix',
        isToday: false,
        justSolved: false,
    };

    it('renders without crashing', () => {
        const { container } = render(<HeatmapCell {...baseProps} />);
        expect(container.querySelector('.heatmap-cell-wrapper')).toBeInTheDocument();
    });

    it('renders the heatmap cell div', () => {
        const { container } = render(<HeatmapCell {...baseProps} />);
        expect(container.querySelector('.heatmap-cell')).toBeInTheDocument();
    });

    it('shows tooltip on hover with date, score, and type', () => {
        const { container } = render(<HeatmapCell {...baseProps} />);
        const wrapper = container.querySelector('.heatmap-cell-wrapper');

        fireEvent.mouseEnter(wrapper);

        expect(screen.getByText('2026-02-17')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('number Matrix')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', () => {
        const { container } = render(<HeatmapCell {...baseProps} />);
        const wrapper = container.querySelector('.heatmap-cell-wrapper');

        fireEvent.mouseEnter(wrapper);
        expect(screen.getByText('2026-02-17')).toBeInTheDocument();

        fireEvent.mouseLeave(wrapper);
        expect(screen.queryByText('2026-02-17')).not.toBeInTheDocument();
    });

    it('shows score 0 when score is null/undefined', () => {
        const { container } = render(
            <HeatmapCell {...baseProps} score={null} />,
        );
        const wrapper = container.querySelector('.heatmap-cell-wrapper');
        fireEvent.mouseEnter(wrapper);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows "Not played" for null puzzleType', () => {
        const { container } = render(
            <HeatmapCell {...baseProps} puzzleType={null} />,
        );
        const wrapper = container.querySelector('.heatmap-cell-wrapper');
        fireEvent.mouseEnter(wrapper);
        expect(screen.getByText('Not played')).toBeInTheDocument();
    });

    it('renders for each intensity level', () => {
        for (let intensity = 0; intensity <= 4; intensity++) {
            const { container, unmount } = render(
                <HeatmapCell {...baseProps} intensity={intensity} />,
            );
            expect(container.querySelector('.heatmap-cell')).toBeInTheDocument();
            unmount();
        }
    });
});
