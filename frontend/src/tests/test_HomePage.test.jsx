import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../pages/HomePage';

describe('HomePage Component', () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    mockSetActiveTab.mockClear();
  });

  test('renders hero title and tagline description', () => {
    render(<HomePage setActiveTab={mockSetActiveTab} />);
    expect(screen.getByText('NeuroVision AI')).toBeInTheDocument();
    expect(screen.getByText('Advanced MRI Neuro-Diagnostic System')).toBeInTheDocument();
  });

  test('renders core telemetry stats blocks correctly', () => {
    render(<HomePage setActiveTab={mockSetActiveTab} />);
    expect(screen.getByText('Model Accuracy')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
    expect(screen.getByText('Processing Time')).toBeInTheDocument();
  });

  test('triggers navigation updates on CTA clicks', () => {
    render(<HomePage setActiveTab={mockSetActiveTab} />);
    const analyzeBtn = screen.getByText('Analyze MRI Scan');
    fireEvent.click(analyzeBtn);
    expect(mockSetActiveTab).toHaveBeenCalledWith('analyze');
  });
});
