import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalysisPage from '../pages/AnalysisPage';

// Mock API endpoints to isolate component testing
jest.mock('../services/api', () => ({
  uploadMRI: jest.fn(),
  generatePDFReport: jest.fn()
}));

describe('AnalysisPage Component', () => {
  test('renders uploader panel and settings initially', () => {
    render(<AnalysisPage />);
    expect(screen.getByText(/MRI File Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & Drop MRI scan slice/i)).toBeInTheDocument();
  });

  test('selects sequence modalities correctly', () => {
    render(<AnalysisPage />);
    const t2Btn = screen.getByRole('button', { name: 'T2' });
    fireEvent.click(t2Btn);
    expect(t2Btn).toHaveClass('bg-violet-500/10');
  });

  test('adjusts confidence threshold sliders', () => {
    render(<AnalysisPage />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
