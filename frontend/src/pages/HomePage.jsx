import React from 'react';
import { Play, Award, Brain, Zap, FileText, ChevronRight, Activity, BookOpen, Users } from 'lucide-react';

export default function HomePage({ setActiveTab }) {
  const stats = [
    { label: "Model Accuracy", value: "96.5%", desc: "Stage 1 classification rate", icon: <Award className="w-5 h-5 text-emerald-400" /> },
    { label: "Classes Detected", value: "4", desc: "Glioma, Meningioma, Pituitary, Normal", icon: <Brain className="w-5 h-5 text-violet-400" /> },
    { label: "Total Images Analyzed", value: "2500+", desc: "Validation & test repository size", icon: <BookOpen className="w-5 h-5 text-sky-400" /> },
    { label: "Processing Time", value: "<2 seconds", desc: "Real-time TTA evaluation latency", icon: <Zap className="w-5 h-5 text-amber-400" /> }
  ];

  const features = [
    {
      title: "Two-Stage Classification Pipeline",
      desc: "An initial screening CNN filters scans into primary classes, passing tumor-detected cases to a secondary classifier that evaluates severity subtypes (Grade 1-4).",
      icon: <Brain className="w-6 h-6 text-violet-400" />
    },
    {
      title: "GradCAM Spatial Explainability",
      desc: "Generates visual gradient-weighted class activation maps at the final feature blocks, exposing hot-spots that drive the neural network's decisions.",
      icon: <Activity className="w-6 h-6 text-emerald-400" />
    },
    {
      title: "PDF Diagnostic Report Engine",
      desc: "Aggregates scan images, GradCAM maps, statistics, and physician notes into a formal report, complete with digital approval signatures.",
      icon: <FileText className="w-6 h-6 text-sky-400" />
    },
    {
      title: "Real-Time Scan Analysis",
      desc: "Decoupled FastAPI backend executes asynchronous PyTorch inference, providing immediate feedback in a responsive React web environment.",
      icon: <Zap className="w-6 h-6 text-amber-400" />
    }
  ];

  return (
    <div className="flex flex-col gap-10 font-sans text-slate-200">
      
      {/* ── 1. Academic Hero Section ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col gap-6 max-w-3xl">
          {/* Institution Label */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
            <span className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md">
              Department of Computer Science & Engineering
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Institute of Advanced Technology</span>
          </div>

          {/* Project Title & Tagline */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              NeuroVision AI
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-300">
              Advanced MRI Neuro-Diagnostic System
            </p>
          </div>

          {/* Core Description */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            A research-grade deep learning solution fine-tuned to classify brain tumor scans and identify visual feature boundaries using GradCAM. This portal demonstrates the transition of PyTorch diagnostic pipelines into a low-latency, decoupled web architecture.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={() => setActiveTab('analyze')}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 transition-all duration-200"
            >
              <Play size={16} fill="currentColor" />
              Analyze MRI Scan
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold rounded-lg transition-all duration-200"
            >
              Read Methodology Docs
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Stats Section ───────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
          System Core Performance Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex flex-col gap-3 shadow-md hover:border-slate-700/80 transition-colors duration-200"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-display">
                  {stat.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Features Section ──────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
          Key Diagnostic Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex gap-4 items-start shadow-md hover:border-slate-700/80 transition-colors duration-200"
            >
              <span className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex-shrink-0">
                {feat.icon}
              </span>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-semibold text-white font-display">
                  {feat.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Academic Switch Links ─────────────────────────── */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <h4 className="text-xs font-semibold text-white">Undergraduate Capstone Portfolio</h4>
            <p className="text-[11px] text-slate-500">Supervised by the CS Engineering Research Division</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('results')} 
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors duration-150 flex items-center gap-1"
          >
            <Activity className="w-3.5 h-3.5" /> Performance Charts
          </button>
        </div>
      </div>

    </div>
  );
}
