# Future Work & Scalability Plans — NeuroVision AI

This document details the roadmap for expanding NeuroVision AI into enterprise hospital networks, integrating 3D scan visualization, and scaling deep learning services.

---

## 1. Architectural Scalability Plans
For high-concurrency environments (e.g., city-wide hospital server clusters), the ASGI uvicorn backend can be upgraded to support distributed inference:
- **Triton Inference Server**: Transition model serving from the FastAPI process to Nvidia Triton. Triton provides:
  - **Dynamic batching** (gathers concurrent requests into a single GPU tensor block).
  - **Model concurrency** (runs multiple instances of the classifier across GPU clusters).
- **Celery & Redis Task Queue**: Decouple long-running batch processing from API endpoints. Scans are placed in a Redis queue and processed by Celery worker pods, returning results via WebSockets.

---

## 2. Advanced Feature Additions

### 2.1 3D DICOM & NIfTI Volume Visualizer
- **Objective**: Replace 2D slice uploads (JPEG/PNG) with full 3D spatial volumes (DICOM files and NIfTI `.nii.gz` sequences).
- **Implementation**:
  - Incorporate Python libraries `pydicom` and `nibabel` to extract axial, coronal, and sagittal planes.
  - Build a 3D coordinate slider in React using `three.js` or `vtk.js`, enabling clinicians to scroll through volumetric slices.

### 2.2 Stage 3 Tumor Segmentation (U-Net)
- **Objective**: Rather than highlighting attention regions using GradCAM, calculate the precise tumor volume in cubic centimeters ($cm^3$) and identify lesion borders.
- **Implementation**:
  - Add a **Stage 3 3D U-Net Model** trained to generate voxel segmentations.
  - Compute tumor dimensions and display voxel masks as semi-transparent red overlays on the slice viewer.

### 2.3 Direct PACS / DICOM Nodes Integration
- **Objective**: Enable clinicians to push scans directly from hospital imaging consoles to the dashboard without manual file exporting.
- **Implementation**:
  - Install a C-STORE SCP DICOM server node (using `pynetdicom` or Orthanc).
  - Register NeuroVision AI as a target Application Entity (AE) in hospital PACS networks.

---

## 3. Future Research Directions
- **Multimodal Clinical Fusion**: Train Transformer backbones that fuse MRI pixel data with tabular EHR metrics (e.g. age, symptoms, molecular markers like IDH status), outputting consolidated prognostic models.
- **Federated Learning Node**: Equip hospital instances with PySyft or Flower frameworks, allowing decentralized workstations to fine-tune the classifiers on local patient demographics without transferring patient health records.
