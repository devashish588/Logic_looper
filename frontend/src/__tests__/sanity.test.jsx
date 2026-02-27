import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('renders learn react link', () => {
  render(<div>Hello World</div>);
  const linkElement = screen.getByText(/Hello World/i);
  expect(linkElement).toBeInTheDocument();
});
