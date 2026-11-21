import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function timeLeft() {
    const ms = dayjs().add(1, 'day').startOf('day').diff(dayjs());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/** "Next puzzle in 5h 12m 09s": counts down to local midnight. */
export default function NextPuzzleCountdown({ className = 'text-muted', style }) {
    const [label, setLabel] = useState(timeLeft);

    useEffect(() => {
        const id = setInterval(() => setLabel(timeLeft()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <p className={className} style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', ...style }}>
            Next puzzle in {label}
        </p>
    );
}
