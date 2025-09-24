// filepath: src/components/Navbar.test.tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';

test('renders NexusCode logo', () => {
  render(<Navbar />);
  expect(screen.getByText(/NexusCode/i)).toBeInTheDocument();
});