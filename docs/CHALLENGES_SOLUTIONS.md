# Engineering Challenges & Solutions — NeuroVision AI

This document outlines the core technical challenges encountered during the design, development, and integration of the NeuroVision AI platform, along with the implemented solutions and engineering lessons learned.

---

## Challenge 1: PDF Generation Crashes from Emojis & Custom Widths
- **Problem**: In clinical practice, clinicians frequently type emojis (e.g., `🧠`, `✅`, `🔴`) or copy-paste rich symbols into recommendation text fields. The custom TrueType DejaVuSans font loaded into `FPDF2` does not contain glyphs for Unicode emoji characters, triggering fatal rendering crashes (`HTTP 500`). Additionally, calling `multi_cell(w=0)` next to list bullet points offset from the margin triggered horizontal space exceptions.
- **Solution**: 
  - Developed a regex sanitization wrapper in the backend (`sanitize_text()`) that strips emoji ranges (`\u2600-\u27BF` and characters above `0xFFFF`) and replaces static header emojis with ASCII labels (`[High Risk]`).
  - Rewrote the FPDF cell widths to explicitly calculate the printable page width bounds (`pdf.epw - width_offset`) instead of relying on default `0` overlays.
- **Alternative Considered**: Loading a secondary full-emoji color font. This was rejected because it increased the PDF generation payload by 24 MB, adding unnecessary load times.

---

## Challenge 2: GPU VRAM OOM under Parallel Batch Processing
- **Problem**: When a clinician uploaded a batch of 20+ high-resolution MRI slices and selected "Parallel Processing", concurrent PyTorch forward passes triggered GPU Out-Of-Memory (OOM) memory faults, crashing the ASGI server.
- **Solution**: 
  - Restructured the React batch inference handler to support a **Concurrency selector** (Sequential vs. Parallel). 
  - Sequential execution runs sequential promises (`await processItem()`) which process one scan at a time, releasing tensor objects from GPU/RAM before starting the next image.
- **Alternative Considered**: Hosting models on a cloud-based serverless gateway. This was rejected due to latency issues and medical privacy laws requiring local workstation data isolation.

---

## Challenge 3: Jarring Cumulative Layout Shift (CLS) on Predictions
- **Problem**: Toggling from a loading text spinner to full graphics panels caused sudden, jarring page height expansions. This increased CLS and created a poor experience for clinicians.
- **Solution**: 
  - Replaced all fullscreen spinners with structural skeleton layouts matching the metrics card grids, table rows, and confidence tracks exactly.
  - Skeletons are wrapped in a dark theme (`#161b22`, `#21262d`) to match the color palette.
- **Alternative Considered**: Absolute-positioning content blocks to overlap each other. This was rejected because it broke the responsiveness of mobile and tablet viewports.

---

## Challenge 4: Missing libGL Shared Libraries in Docker Deployments
- **Problem**: When booting the backend service in a docker container, OpenCV crashed with the error `ImportError: libGL.so.1: cannot open shared object file: No such file or directory`.
- **Solution**: 
  - Modified [backend/Dockerfile](file:///c:/Users/tbans/Downloads/NeuroVision-AI-20260610T090351Z-3-001/NeuroVision-AI/backend/Dockerfile) to update the Debian system packages list on build and install the missing OpenGL shared layers:
    ```dockerfile
    RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0
    ```
- **Alternative Considered**: Recompiling OpenCV without OpenGL bindings. This was rejected because it would have required compiling OpenCV from source inside the Dockerfile, increasing build times by over 20 minutes.

---

## Core Engineering Lessons Learned
1. **Never Trust User Unicode Input in Document Compilers**: PDF generators require strict text sanitization filters.
2. **Design UI Skeleton Grids First**: Laying out skeleton containers that mirror final data displays prevents layout shifts and improves perceived performance.
3. **Always Include Local Mock Modes in Medical Systems**: Having a simulated Demo Mode offline guarantees that system features remain testable and interactive even when GPU or server clusters are unreachable.
