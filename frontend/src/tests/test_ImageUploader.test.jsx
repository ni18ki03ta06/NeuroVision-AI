import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploader from '../components/ImageUploader';

describe('ImageUploader Component', () => {
  const mockOnFileSelected = jest.fn();

  beforeEach(() => {
    mockOnFileSelected.mockClear();
  });

  test('renders upload uploader targets', () => {
    render(<ImageUploader onFileSelected={mockOnFileSelected} />);
    expect(screen.getByText(/Upload Brain MRI Scan\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop T1, T1C\+, or T2 scans/i)).toBeInTheDocument();
  });

  test('triggers callback upon file selection', () => {
    const { container } = render(<ImageUploader onFileSelected={mockOnFileSelected} />);
    const file = new File(['dummy content'], 'brain.jpg', { type: 'image/jpeg' });
    
    // Select the file input node
    const input = container.querySelector('input[type="file"]');
    
    // Simulate input select
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check that preview rendered
    expect(screen.getByAltText(/Scan upload preview/i)).toBeInTheDocument();
    
    // Simulate analysis trigger click
    const runBtn = screen.getByText('Run Diagnostic Inference');
    fireEvent.click(runBtn);
    
    expect(mockOnFileSelected).toHaveBeenCalledWith(file);
  });
});
