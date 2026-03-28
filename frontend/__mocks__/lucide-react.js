/**
 * Mock for lucide-react icons.
 * Each icon is a simple component that renders a div with a data-testid.
 */
import React from 'react';

const createMockIcon = (name) => {
    return React.forwardRef(function MockIcon(props, ref) {
        return React.createElement('div', {
            ...props,
            ref,
            'data-testid': `icon-${name}`,
        });
    });
};

// Export all icons used in the app
export const Home = createMockIcon('home');
export const Gamepad2 = createMockIcon('gamepad2');
export const BarChart3 = createMockIcon('barchart3');
export const Award = createMockIcon('award');
export const Settings = createMockIcon('settings');
export const Lightbulb = createMockIcon('lightbulb');
export const Clock = createMockIcon('clock');
export const CheckCircle = createMockIcon('checkcircle');
export const AlertTriangle = createMockIcon('alerttriangle');
export const User = createMockIcon('user');
export const Mail = createMockIcon('mail');
export const Lock = createMockIcon('lock');
export const Eye = createMockIcon('eye');
export const EyeOff = createMockIcon('eyeoff');
export const ArrowLeft = createMockIcon('arrowleft');
export const RotateCcw = createMockIcon('rotateccw');
export const Flame = createMockIcon('flame');
export const Trophy = createMockIcon('trophy');
export const Gem = createMockIcon('gem');
export const Zap = createMockIcon('zap');
export const Star = createMockIcon('star');
export const Target = createMockIcon('target');
export const Moon = createMockIcon('moon');
export const Volume2 = createMockIcon('volume2');
export const Info = createMockIcon('info');
export const Calendar = createMockIcon('calendar');
export const LogOut = createMockIcon('logout');
export const Hash = createMockIcon('hash');
export const Palette = createMockIcon('palette');
export const Link = createMockIcon('link');
export const Puzzle = createMockIcon('puzzle');
export const CircuitBoard = createMockIcon('circuitboard');
export const Swords = createMockIcon('swords');
export const Crown = createMockIcon('crown');
export const Bird = createMockIcon('bird');
export const Smartphone = createMockIcon('smartphone');
export const Chrome = createMockIcon('chrome');
