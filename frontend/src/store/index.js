import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice.js';
import statsReducer from './statsSlice.js';
import settingsReducer from './settingsSlice.js';
import authReducer from './authSlice.js';

const store = configureStore({
    reducer: {
        game: gameReducer,
        stats: statsReducer,
        settings: settingsReducer,
        auth: authReducer,
    },
});

export default store;

