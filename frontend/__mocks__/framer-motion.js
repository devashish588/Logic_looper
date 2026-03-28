/**
 * Mock for framer-motion.
 * `motion.*` elements render as plain DOM elements.
 * `AnimatePresence` renders children directly.
 */
import React from 'react';

const handler = {
    get(_, prop) {
        // motion.div, motion.span, etc.
        return React.forwardRef(function MotionMock(props, ref) {
            const {
                initial,
                animate,
                exit,
                transition,
                variants,
                whileHover,
                whileTap,
                whileInView,
                layout,
                layoutId,
                ...rest
            } = props;
            return React.createElement(prop, { ...rest, ref });
        });
    },
};

export const motion = new Proxy({}, handler);

export function AnimatePresence({ children }) {
    return React.createElement(React.Fragment, null, children);
}

export function useAnimation() {
    return { start: jest.fn(), stop: jest.fn() };
}

export function useMotionValue(initial) {
    return { get: () => initial, set: jest.fn() };
}
