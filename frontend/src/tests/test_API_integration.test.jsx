import { uploadMRI, generatePDFReport } from '../services/api';

describe('API Integration Wrappers', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('uploadMRI posts file and returns JSON prediction', async () => {
    const mockResponse = { tumor_type: 'Glioma', risk_level: 'high' };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const file = new File(['dummy bytes'], 'scan.jpg', { type: 'image/jpeg' });
    const result = await uploadMRI(file, 'T1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/predict'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('generatePDFReport posts json data and returns file blob stream', async () => {
    const mockBlob = new Blob(['pdf bytes'], { type: 'application/pdf' });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    const payload = { result: {}, original_image: 'b64', gradcam_heatmap: 'b64' };
    const result = await generatePDFReport(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate-pdf'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
    expect(result).toEqual(mockBlob);
  });
});
