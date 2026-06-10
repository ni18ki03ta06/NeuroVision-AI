import React, { useState } from 'react';
import { BookOpen, Network, BarChart2, ShieldAlert, Info, ChevronRight, Activity, Database, HelpCircle } from 'lucide-react';

export default function DocumentationPage() {
  const [activeSubTab, setActiveSubTab] = useState('how_it_works');

  const subTabs = [
    { id: 'how_it_works', label: 'How It Works', icon: <Network size={14} /> },
    { id: 'methodology', label: 'Methodology', icon: <Activity size={14} /> },
    { id: 'dataset', label: 'Dataset', icon: <Database size={14} /> },
    { id: 'tumor_types', label: 'Tumor Types', icon: <Info size={14} /> },
    { id: 'disclaimers', label: 'Limitations & Disclaimers', icon: <ShieldAlert size={14} /> }
  ];

  return (
    <div className="flex flex-col gap-8 text-slate-200">
      
      {/* ── Header tab navigation bar ───────────────────────── */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <BookOpen className="text-violet-400 w-5 h-5" /> NeuroVision AI Methodological Documentation
          </h2>
          <p className="text-xs text-slate-500 mt-1">Technical specifications and literature review for clinicians and developers</p>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content Router ───────────────────────────────── */}
      <div className="bg-slate-900/25 border border-slate-800/60 p-6 rounded-2xl shadow-sm min-h-[400px]">
        
        {/* 1. How It Works Tab */}
        {activeSubTab === 'how_it_works' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-white font-display">The Two-Stage Deep Classification Pipeline</h3>
              <p className="text-xs text-slate-400 mt-1">Details on visual feature routing, augmentations, and interpretability</p>
            </div>

            {/* SVG Pipeline Diagram */}
            <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-xl flex items-center justify-center overflow-x-auto">
              <svg width="680" height="150" viewBox="0 0 680 150" className="text-slate-400">
                {/* Arrow markers */}
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
                  </marker>
                </defs>

                {/* Input MRI Node */}
                <rect x="10" y="50" width="100" height="50" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="60" y="75" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">Input MRI Scan</text>
                <text x="60" y="90" textAnchor="middle" fill="#94a3b8" fontSize="8">(T1, T1C+, T2)</text>

                <line x1="110" y1="75" x2="150" y2="75" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Stage 1 Node */}
                <rect x="150" y="50" width="120" height="50" rx="6" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
                <text x="210" y="75" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Stage 1 Classifier</text>
                <text x="210" y="90" textAnchor="middle" fill="#c084fc" fontSize="8">(Tumor Type Detection)</text>

                <line x1="270" y1="75" x2="310" y2="75" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Decision Junction Node */}
                <polygon points="310,75 345,40 380,75 345,110" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <text x="345" y="78" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Tumor?</text>

                {/* Branch: No Tumor (Early exit) */}
                <line x1="345" y1="110" x2="345" y2="135" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x="350" y="125" fill="#f87171" fontSize="9" fontWeight="bold">No</text>
                
                <rect x="295" y="135" width="100" height="30" rx="4" fill="#064e3b" stroke="#065f46" strokeWidth="1" />
                <text x="345" y="153" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">Normal Exit</text>

                {/* Branch: Yes */}
                <line x1="380" y1="75" x2="430" y2="75" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x="400" y="68" fill="#34d399" fontSize="9" fontWeight="bold">Yes</text>

                {/* Stage 2 Node */}
                <rect x="430" y="50" width="110" height="50" rx="6" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
                <text x="485" y="75" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Stage 2 Classifier</text>
                <text x="485" y="90" textAnchor="middle" fill="#c084fc" fontSize="8">(Severity Grading)</text>

                <line x1="540" y1="75" x2="570" y2="75" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Output Node */}
                <rect x="570" y="40" width="100" height="70" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <text x="620" y="65" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Diagnostic JSON</text>
                <text x="620" y="80" textAnchor="middle" fill="#38bdf8" fontSize="8">GradCAM Maps</text>
                <text x="620" y="95" textAnchor="middle" fill="#34d399" fontSize="8">PDF Generation</text>
              </svg>
            </div>

            {/* Stage Detailed Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Stage 1: Tumor Type Classification (4 Classes)</h4>
                <p className="text-xs leading-relaxed text-slate-350">
                  Runs the initial diagnostic layer on the incoming slice. The model classifies the feature inputs into **Glioma**, **Meningioma**, **Pituitary**, or **No Tumor**. If "No Tumor" is classified, the system completes inference early, logging the case as healthy.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Stage 2: Severity Classification (6 Classes)</h4>
                <p className="text-xs leading-relaxed text-slate-350">
                  If Stage 1 indicates a tumor anomaly, the scan is passed into the Stage 2 classifier. This model performs similarity grading across six folders corresponding to specific pathological subtypes: **Glioma**, **Meningioma**, **Neurocytoma**, **Normal**, **Other Lesions**, and **Schwannoma**.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Test-Time Augmentation (TTA)</h4>
                <p className="text-xs leading-relaxed text-slate-350">
                  Medical image slices can vary in rotation, cropping, and contrast. To increase classifier robustness, the system uses **8x TTA**. The scan is transformed into 8 augmented views. Softmax probabilities from all 8 views are averaged to yield the final prediction, reducing false-positive rates.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">GradCAM Gradient Explanations</h4>
                <p className="text-xs leading-relaxed text-slate-350">
                  GradCAM calculates the gradients of the target class score with respect to feature map activations in the final convolutional layer of EfficientNet. This exposes the spatial localization "hot-spots" directly driving classification, offering radiologists explainable visual bounds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Methodology Tab */}
        {activeSubTab === 'methodology' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-white font-display">Deep Learning Methodology</h3>
              <p className="text-xs text-slate-400 mt-1">Model backbones, transfer learning configs, and fine-tuning parameters</p>
            </div>

            <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-350">
              <p>
                <strong>Model Architecture Selection: EfficientNet-B2</strong><br />
                We utilize **EfficientNet-B2** as our feature extractor. EfficientNet models scale network depth, width, and input resolution uniformly using a compound coefficient. B2 provides an optimal balance between parameter capacity (~7.7M parameters) and diagnostic accuracy, avoiding the over-fitting typical of heavier architectures on limited medical datasets.
              </p>
              <p>
                <strong>Transfer Learning Approach</strong><br />
                The networks are initialized with pre-trained weights from the ImageNet database. This equips the convolutional layers with robust generalized feature-extracting capabilities (such as edges, blobs, and textures), reducing training convergence time and parameter requirements.
              </p>
              <p>
                <strong>Fine-Tuning Strategy</strong><br />
                To adapt the backbone to neuro-oncology diagnostics, we freeze the early layers and unfreeze only the final two feature blocks (specifically layers `features.7` and `features.8`) along with the classifier head. The classification head is replaced with a custom MLP: <code>Linear (1408 &rarr; 512) &rarr; BatchNorm &rarr; SiLU &rarr; Dropout (0.3) &rarr; Linear (512 &rarr; classes)</code>. This unfreezing strategy allows the network to preserve early edge detection weights while tailoring receptive fields to high-level tumor textures.
              </p>
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl mt-2">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 font-display">Validated Performance Metrics</h4>
                <ul className="list-disc pl-5 flex flex-col gap-1 text-[11px] text-slate-400">
                  <li><strong>Stage 1 (Tumor/Normal):</strong> Accuracy: 96.5% | Precision: 95.2% | Recall: 94.8% | F1: 95.0%</li>
                  <li><strong>Stage 2 (Severity Grading):</strong> Accuracy: 91.5% | Precision: 90.8% | Recall: 91.2% | F1: 91.0%</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 3. Dataset Tab */}
        {activeSubTab === 'dataset' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-white font-display">Dataset Details & Preprocessing</h3>
              <p className="text-xs text-slate-400 mt-1">Image counts, sequence modalities, and normalization parameters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-350">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">MRI Sequence Modalities</h4>
                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-400">
                  <li><strong>T1-Weighted:</strong> Exposes anatomical boundaries and cerebrospinal fluid.</li>
                  <li><strong>T1C+ (Contrast-Enhanced):</strong> Utilizes Gadolinium contrast to highlight hyper-intense vascular regions, defining tumor boundaries.</li>
                  <li><strong>T2-Weighted:</strong> Fluid-attenuated sensitive slice, highlighting surrounding edema and cysts.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Preprocessing & Normalization</h4>
                <p className="text-slate-400 leading-normal">
                  Before passing slices into the model, images are resized to **224x224** pixels and scaled to [0.0, 1.0]. Standard PyTorch Normalization is executed:
                </p>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 font-mono text-[10px] text-violet-300">
                  Mean = [0.1835, 0.1835, 0.1836]<br />
                  Std  = [0.1814, 0.1814, 0.1814]
                </div>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Train/Test Data Splits</h4>
                <p className="text-slate-400">
                  The models were trained using a total of **7,023** MRI slice files compiled from public repositories (such as Figshare and BraTS). Slices are split as follows:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center mt-1">
                  <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg">
                    <div className="text-lg font-bold text-white font-display">5,712</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Training Slices</div>
                  </div>
                  <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg">
                    <div className="text-lg font-bold text-white font-display">1,311</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Test Slices</div>
                  </div>
                  <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg">
                    <div className="text-lg font-bold text-white font-display">20%</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Hold-out Validation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Tumor Types Tab */}
        {activeSubTab === 'tumor_types' && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-white font-display">Anatomical Profiles of Classified Anomalies</h3>
              <p className="text-xs text-slate-400 mt-1">Descriptions and severity risks for neuro-oncology tumor classifications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Glioma */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Glioma</h4>
                  <span className="text-[9px] font-bold text-red-400 bg-red-950/40 border border-red-800/60 px-2 py-0.5 rounded uppercase">High Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Originates in the glial support cells of the brain. Subtypes include Astrocytoma, Oligodendroglioma, and Glioblastoma Multiforme (GBM). Represents Grade 1-4. Grade 4 GBMs are highly aggressive and rapidly growing.
                </p>
              </div>

              {/* Meningioma */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Meningioma</h4>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded uppercase">Low-High Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Arises from the meningeal membranes surrounding the brain and spinal cord. Typically slow-growing (Grade 1 benign), but can range to atypical (Grade 2) or anaplastic (Grade 3), causing localized pressure.
                </p>
              </div>

              {/* Pituitary */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Pituitary</h4>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded uppercase">Low Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Originates in the pituitary gland at the skull base. Most are benign adenomas. Though non-cancerous, their growth can compress the optic chiasm, causing visual impairment, or disrupt hormone secretion.
                </p>
              </div>

              {/* Schwannoma */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Schwannoma</h4>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded uppercase">Low Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Develops from myelin-producing Schwann cells covering cranial nerves (most commonly the vestibular nerve, leading to acoustic neuromas). Typically slow-growing and benign (Grade 1).
                </p>
              </div>

              {/* Neurocytoma */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Neurocytoma</h4>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded uppercase">Low Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Typically benign intraventricular tumors arising from neuronal cells, usually located in the lateral ventricles near the foramen of Monro. Can obstruct CSF flow, causing hydrocephalus.
                </p>
              </div>

              {/* Others */}
              <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white font-display">Other Lesions</h4>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded uppercase">Medium Risk</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Encompasses overlapping features from abscesses, arachnoid cysts, hematomas, or encephalitis anomalies. The classification serves as an alert flag suggesting radiologist review.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* 5. Limitations & Disclaimers */}
        {activeSubTab === 'disclaimers' && (
          <div className="flex flex-col gap-6 max-w-4xl text-xs leading-relaxed text-slate-350">
            <div>
              <h3 className="text-base font-bold text-white font-display">Limitations & Disclaimers</h3>
              <p className="text-xs text-slate-400 mt-1">Regulatory warnings, medical limits, and context boundaries</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-amber-950/20 border border-amber-900/40 text-amber-400 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <strong>Research Use Only Disclaimer</strong>
                  <span>
                    This dashboard runs custom deep-learning classifiers on MRI slices for educational and research demonstration purposes. It does not provide certified medical diagnoses and has not received FDA or CE approval for clinical use.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Clinical Workflow Context</h4>
                <p>
                  This system is designed as a computer-aided exploration dashboard. It should only be used by trained medical professionals or researchers to inspect convolutional activation boundaries. It must never substitute for histopathological biopsies or formal evaluations by certified radiologists.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Model Limitations</h4>
                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-400">
                  <li><strong>2D Slice Dependency:</strong> The models process individual 2D axial/sagittal slices rather than full 3D volumetric DICOM segmentations. Volume estimation is not performed.</li>
                  <li><strong>Artifact Susceptibility:</strong> Low-resolution scans, motion artifacts, or contrast inconsistencies can lead to GradCAM displacement or incorrect classification.</li>
                  <li><strong>Unseen Pathology:</strong> Rare pathologies (such as metastases or lymphoma) may be misclassified into glioma or other lesions, as the models are constrained to pre-trained classes.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
