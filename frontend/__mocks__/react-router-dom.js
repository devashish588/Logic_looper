/**
 * Lightweight CJS mock for react-router-dom v7.
 * Prevents Jest from trying to parse the ESM package.
 */
const React = require('react');

function MemoryRouter({ children }) {
    return React.createElement(React.Fragment, null, children);
}

function BrowserRouter({ children }) {
    return React.createElement(React.Fragment, null, children);
}

function Routes({ children }) {
    return React.createElement(React.Fragment, null, children);
}

function Route() {
    return null;
}

function Link({ to, children, ...props }) {
    return React.createElement('a', { href: to, ...props }, children);
}

function NavLink({ to, children, ...props }) {
    return React.createElement('a', { href: to, ...props }, children);
}

function Navigate() {
    return null;
}

function Outlet() {
    return null;
}

function useNavigate() {
    return jest.fn();
}

function useLocation() {
    return { pathname: '/', search: '', hash: '', state: null };
}

function useParams() {
    return {};
}

function useSearchParams() {
    return [new URLSearchParams(), jest.fn()];
}

module.exports = {
    MemoryRouter,
    BrowserRouter,
    Routes,
    Route,
    Link,
    NavLink,
    Navigate,
    Outlet,
    useNavigate,
    useLocation,
    useParams,
    useSearchParams,
};
