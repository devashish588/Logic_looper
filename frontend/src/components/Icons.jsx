import React from 'react';
import {
    Home,
    Gamepad2,
    BarChart3,
    Award,
    Settings,
    Lightbulb,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    RotateCcw,
    Flame,
    Trophy,
    Gem,
    Zap,
    Star,
    Target,
    Moon,
    Volume2,
    Info,
    Calendar,
    LogOut,
    Hash,
    Palette,
    Link,
    Puzzle,
    CircuitBoard,
    Swords,
    Crown,
    Bird,
} from 'lucide-react';

// Re-export all icons used across the app
export {
    Home,
    Gamepad2,
    BarChart3,
    Award,
    Settings,
    Lightbulb,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    RotateCcw,
    Flame,
    Trophy,
    Gem,
    Zap,
    Star,
    Target,
    Moon,
    Volume2,
    Info,
    Calendar,
    LogOut,
    Hash,
    Palette,
    Link,
    Puzzle,
    CircuitBoard,
    Swords,
    Crown,
    Bird,
};

/**
 * Maps puzzle type string keys to Lucide icon components.
 */
export const PuzzleIconMap = {
    numberMatrix: Hash,
    patternMatch: Palette,
    sequenceSolver: Link,
    deductionGrid: Puzzle,
    binaryLogic: Zap,
};

/**
 * Renders the appropriate Lucide icon for a puzzle type.
 */
export function PuzzleIcon({ type, size = 24, ...props }) {
    const Icon = PuzzleIconMap[type];
    if (!Icon) return null;
    return <Icon size={size} strokeWidth={1.5} {...props} />;
}

/**
 * Maps achievement icon keys to Lucide icon components.
 */
const AchievementIconMap = {
    target: Target,
    flame: Flame,
    swords: Swords,
    crown: Crown,
    circuitBoard: CircuitBoard,
    zap: Zap,
    star: Star,
    gem: Gem,
    moon: Moon,
    bird: Bird,
};

/**
 * Renders the appropriate Lucide icon for an achievement.
 */
export function AchievementIcon({ iconKey, size = 28, ...props }) {
    const Icon = AchievementIconMap[iconKey];
    if (!Icon) return <Star size={size} strokeWidth={1.5} {...props} />;
    return <Icon size={size} strokeWidth={1.5} {...props} />;
}
