import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Database, 
  ShieldAlert, 
  Microscope, 
  Scan, 
  Activity, 
  Layers, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Sparkles, 
  Cpu, 
  Zap, 
  Award, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Sliders,
  AlertTriangle,
  Info,
  Maximize2,
  Lock,
  GitCommit,
  CheckCircle
} from 'lucide-react';

// ── 1. Hero Header Component ──────────────────────────────────────────
export function MethodologyHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NeuroVision AI Engine v1.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
          Methodology Documentation
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl font-normal leading-relaxed">
          Understand how NeuroVision AI processes MRI scans from image input to diagnostic report.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Dataset</span>
            <Database className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2 text-base font-bold text-white font-display">7,023</div>
          <div className="text-[10px] text-slate-400">MRI Slices</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Accuracy</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-base font-bold text-emerald-400 font-display">96.5%</div>
          <div className="text-[10px] text-slate-400">Stage 1 Test</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Model</span>
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="mt-2 text-base font-bold text-violet-300 font-display">B2</div>
          <div className="text-[10px] text-slate-400">EfficientNet</div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Pipeline Stepper Component ─────────────────────────────────────
export function PipelineStepper() {
  const steps = [
    {
      step: '01',
      title: 'Upload MRI',
      description: 'Drag & drop T1, T1C+, or T2 DICOM slice file',
      icon: Scan,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    },
    {
      step: '02',
      title: 'Preprocessing',
      description: '224x224 Resizing & 8x TTA augmentations',
      icon: Layers,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      step: '03',
      title: 'Tumor Detection',
      description: 'Stage 1 4-Class deep classification',
      icon: Brain,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    },
    {
      step: '04',
      title: 'Severity Classification',
      description: 'Stage 2 Pathological subtype grading',
      icon: Activity,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      step: '05',
      title: 'GradCAM',
      description: 'Gradient heatmaps & visual attention',
      icon: Sparkles,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      step: '06',
      title: 'Diagnostic Report',
      description: 'JSON metrics output & PDF generator',
      icon: FileText,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-violet-400" />
          <span>Diagnostic Pipeline Architecture</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">End-to-End Latency: ~2.2s</span>
      </div>

      {/* Responsive Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          return (
            <motion.div
              key={s.step}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 hover:shadow-violet-500/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${s.bgColor} ${s.borderColor} border ${s.color}`}>
                  <StepIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-500 px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800">
                  {s.step}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-1 group-hover:text-violet-300 transition-colors font-display">
                  {s.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {s.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. Stage Card Component ───────────────────────────────────────────
export function StageCard({ stage, title, icon: Icon, bullets, color = 'violet' }) {
  const colorMap = {
    violet: {
      badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      hover: 'hover:border-violet-500/40',
      dot: 'bg-violet-400'
    },
    blue: {
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      hover: 'hover:border-blue-500/40',
      dot: 'bg-blue-400'
    },
    emerald: {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hover: 'hover:border-emerald-500/40',
      dot: 'bg-emerald-400'
    }
  };

  const style = colorMap[color] || colorMap.violet;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-md ${style.hover} transition-all space-y-4 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl border ${style.badge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
            {stage}
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-3 font-display">
          {title}
        </h3>

        <ul className="space-y-2 text-xs text-slate-300">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ── 4. GradCAM Card Component ─────────────────────────────────────────
export function GradcamCard() {
  const features = [
    'Heatmaps (Jet, Viridis, Hot)',
    'Visual Attention Hotspots',
    'AI Transparency & Explainability',
    'Grad-Weighted Activations'
  ];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/60 font-mono">
            Visual Hotspots
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-3 font-display">
          GradCAM Explainability
        </h3>

        <ul className="space-y-2 text-xs text-slate-300">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ── 5. Stats Grid Component ───────────────────────────────────────────
export function StatsGrid() {
  const stats = [
    { label: 'Dataset Size', value: '7,023', sub: 'MRI Slices', color: 'text-violet-400' },
    { label: 'MRI Modalities', value: '3', sub: 'T1, T1C+, T2', color: 'text-blue-400' },
    { label: 'Number of Classes', value: '10', sub: '4 Stage1 / 6 Stage2', color: 'text-purple-400' },
    { label: 'Training Images', value: '5,712', sub: '80% Train Split', color: 'text-cyan-400' },
    { label: 'Validation Images', value: '1,311', sub: '20% Holdout', color: 'text-amber-400' },
    { label: 'Testing Images', value: '1,311', sub: 'Holdout Evaluation', color: 'text-emerald-400' },
    { label: 'Accuracy', value: '96.5%', sub: 'Stage 1 Benchmark', color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((st, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.02 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {st.label}
          </span>
          <div className={`text-xl font-bold font-display my-1 ${st.color}`}>
            {st.value}
          </div>
          <span className="text-[10px] text-slate-400">
            {st.sub}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ── 6. Dataset Card Component ─────────────────────────────────────────
export function DatasetCard() {
  const modalities = [
    {
      name: 'T1-Weighted',
      desc: 'High-resolution anatomical boundaries',
      details: ['Exposes cerebrospinal fluid boundaries', 'Anatomical structure baseline']
    },
    {
      name: 'T1C+ (Contrast)',
      desc: 'Gadolinium contrast-enhanced slice',
      details: ['Highlights hyper-intense vascular regions', 'Defines active tumor borders']
    },
    {
      name: 'T2-Weighted',
      desc: 'Fluid-attenuated edema sensitivity',
      details: ['Exposes surrounding cerebral edema', 'Highlights fluid cysts & inflammation']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modalities.map((m, idx) => (
        <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-display">{m.name}</h4>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-slate-400 leading-normal">{m.desc}</p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {m.details.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ── 7. Limitation Card Component ──────────────────────────────────────
export function LimitationCard() {
  const limitations = [
    {
      title: 'Research Use Only',
      desc: 'Educational & research demonstration portal. Not FDA/CE certified for primary clinical diagnosis.',
      icon: ShieldAlert,
      color: 'text-amber-400',
      badge: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: '2D Slice Dependency',
      desc: 'Processes 2D axial/sagittal slices rather than full 3D volumetric DICOM segmentations.',
      icon: Layers,
      color: 'text-blue-400',
      badge: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Artifact Susceptibility',
      desc: 'Severe motion artifacts or low resolution contrast can affect GradCAM visual heatmap bounds.',
      icon: AlertTriangle,
      color: 'text-orange-400',
      badge: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      title: 'Unseen Pathology',
      desc: 'Rare unclassified lesions default to nearest anatomical feature representation in Stage 1/2.',
      icon: Microscope,
      color: 'text-violet-400',
      badge: 'bg-violet-500/10 border-violet-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {limitations.map((l, idx) => {
        const LimIcon = l.icon;
        return (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
          >
            <div className={`p-2.5 rounded-xl border ${l.badge} ${l.color} flex-shrink-0 mt-0.5`}>
              <LimIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white font-display">{l.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{l.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


// ── MAIN DOCUMENTATION PAGE COMPONENT ─────────────────────────────────
export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'pipeline', label: 'Pipeline', icon: GitCommit },
    { id: 'models', label: 'AI Models', icon: Cpu },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'gradcam', label: 'GradCAM', icon: Sparkles },
    { id: 'limitations', label: 'Limitations', icon: ShieldAlert }
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-8 text-slate-200">
      
      {/* Hero Header */}
      <MethodologyHeader />

      {/* Modern Tabs Switcher */}
      <div className="flex items-center justify-start overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-md shadow-violet-600/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Active Tab Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="space-y-8"
        >
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stepper */}
              <PipelineStepper />

              {/* 3 Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StageCard
                  stage="Stage 1"
                  title="Tumor Detection"
                  icon={Brain}
                  color="violet"
                  bullets={[
                    'Detects Glioma (High Risk)',
                    'Detects Pituitary (Low Risk)',
                    'Detects Meningioma (Low-High)',
                    'Detects Healthy Brain (Normal)'
                  ]}
                />

                <StageCard
                  stage="Stage 2"
                  title="Severity Prediction"
                  icon={Activity}
                  color="blue"
                  bullets={[
                    'Grade I (Benign / Slow Growth)',
                    'Grade II (Atypical Lesions)',
                    'Grade III / IV (High Aggression)',
                    'Softmax Confidence & TTA Score'
                  ]}
                />

                <GradcamCard />
              </div>

              {/* Stats Summary */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-display">System Benchmarks</h3>
                  <span className="text-xs text-slate-400">Validated on 7,023 Slices</span>
                </div>
                <StatsGrid />
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-8">
              <PipelineStepper />

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-violet-400" />
                  <span>Pipeline Logic & Data Flow</span>
                </h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-mono">01</span>
                    <div>
                      <strong className="text-white block font-display mb-0.5">Input Slice Processing</strong>
                      <span className="text-slate-400">The user uploads an MRI slice (T1, T1C+, or T2). Images are normalized and scaled to [0.0, 1.0].</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-mono">02</span>
                    <div>
                      <strong className="text-white block font-display mb-0.5">8x Test-Time Augmentation (TTA)</strong>
                      <span className="text-slate-400">Generates 8 transformed views (rotations, flips, contrast shifts) to eliminate rotation bias and ensure consistent output.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-mono">03</span>
                    <div>
                      <strong className="text-white block font-display mb-0.5">Stage 1 Anomaly Gating</strong>
                      <span className="text-slate-400">If Stage 1 classifies "No Tumor", the pipeline completes early with a healthy status log.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-mono">04</span>
                    <div>
                      <strong className="text-white block font-display mb-0.5">Stage 2 Subtype Grading</strong>
                      <span className="text-slate-400">If a tumor is present, Stage 2 performs similarity grading across 6 pathological subtype classes.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: AI MODELS */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StageCard
                  stage="Stage 1 Classifier"
                  title="Tumor Type Classifier (4 Classes)"
                  icon={Brain}
                  color="violet"
                  bullets={[
                    'EfficientNet-B2 Backbone (~7.7M params)',
                    'Softmax probabilities across 4 categories',
                    '96.5% Benchmark Accuracy',
                    'Early exit gating for healthy brain scans'
                  ]}
                />

                <StageCard
                  stage="Stage 2 Classifier"
                  title="Severity Subtype Classifier (6 Classes)"
                  icon={Activity}
                  color="blue"
                  bullets={[
                    'Grading across 6 pathological folders',
                    'Differentiates Glioma, Meningioma, Neurocytoma',
                    'Assesses WHO Grade I to IV risk levels',
                    '91.5% Subtype Classification Accuracy'
                  ]}
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <span>Architecture & Fine-Tuning Setup</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <strong className="text-white block font-display">Backbone Network</strong>
                    <p className="text-slate-400">EfficientNet-B2 with compound scaling across depth, width, and resolution.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <strong className="text-white block font-display">Transfer Learning</strong>
                    <p className="text-slate-400">Pre-trained ImageNet weights with unfrozen top features blocks (layers 7 & 8).</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <strong className="text-white block font-display">Classifier Head</strong>
                    <p className="text-slate-400">Linear (1408 &rarr; 512) &rarr; BatchNorm &rarr; SiLU &rarr; Dropout (0.3) &rarr; Output.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATASET */}
          {activeTab === 'dataset' && (
            <div className="space-y-6">
              <StatsGrid />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-display">MRI Modality Breakdown</h3>
                <DatasetCard />
              </div>
            </div>
          )}

          {/* TAB 5: GRADCAM */}
          {activeTab === 'gradcam' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GradcamCard />

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white font-display">Visual Attention Mapping</h3>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                      <span><strong>Gradient Extraction:</strong> Computes gradients of the target class score relative to feature maps in the final conv layer.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                      <span><strong>Spatial Localization:</strong> Highlights exact tissue region driving the network's prediction.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                      <span><strong>Colormaps:</strong> Jet, Viridis, Hot, Plasma, Inferno, and Magma opacity overlays.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LIMITATIONS */}
          {activeTab === 'limitations' && (
            <div className="space-y-6">
              <LimitationCard />
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
