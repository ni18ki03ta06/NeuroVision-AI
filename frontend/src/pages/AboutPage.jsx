import React from 'react';
import { Users, GraduationCap, Award, Mail, Cpu, Terminal, BookOpen, Layers, Phone } from 'lucide-react';

export default function AboutPage() {
  // Academic & Student details (User can customize these placeholders)
  const student = {
    name: "[Student Name]",
    rollNumber: "[Roll Number / Registration ID]",
    college: "[College / University Name]",
    department: "Department of Computer Science & Engineering",
    batch: "2022 - 2026 (Final Year B.Tech / BE)"
  };

  const supervisor = {
    name: "Dr. Ritesh Sen",
    designation: "Professor & Research Advisor",
    department: "Department of Computer Science & Engineering",
    email: "ritesh.sen@college.edu"
  };

  const techStack = [
    { category: "Backend Engine", items: ["FastAPI (Python 3.10+)", "PyTorch (Inference)", "Uvicorn (ASGI Server)", "FPDF2 (PDF Engine)"], icon: <Terminal className="w-5 h-5 text-violet-400" /> },
    { category: "Frontend Dashboard", items: ["React (Hooks & Lifecycle)", "Tailwind CSS v3 (Utility Styling)", "Recharts (Interactive Charts)", "Vite 5 (Build Toolchain)"], icon: <Layers className="w-5 h-5 text-emerald-400" /> },
    { category: "Neural Network Weights", items: ["EfficientNet-B2 Backbone", "Compound Scaling Weights", "Test-Time Augmentations (8x)"], icon: <Cpu className="w-5 h-5 text-sky-400" /> },
    { category: "Interpretability & Analytics", items: ["GradCAM Gradients", "Matplotlib Colormap Encoders", "SVG Progress Speed-Ring Gauges"], icon: <Activity className="w-5 h-5 text-amber-400" /> }
  ];

  const citations = [
    { author: "Tan, M. and Le, Q. V.", title: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks", journal: "International Conference on Machine Learning (ICML)", year: "2019" },
    { author: "Selvaraju, R. R. et al.", title: "Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization", journal: "IEEE International Conference on Computer Vision (ICCV)", year: "2017" },
    { author: "Cheng, J. et al.", title: "Brain Tumor Dataset: FIGSHARE Open Repository for Tumor Slices Classification", journal: "Open Dataset Repository", year: "2017" }
  ];

  return (
    <div className="flex flex-col gap-10 font-sans text-slate-200">
      
      {/* ── 1. Project Overview, Objectives & Outcomes ───────── */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-2xl shadow-md flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-display">Project Portfolio: NeuroVision AI</h2>
          <p className="text-xs text-slate-500 mt-1">Undergraduate B.Tech Capstone Project Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-350">
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-violet-400 font-display">Abstract Description</h4>
            <p>
              NeuroVision AI is a decoupled, microservice-based diagnostic interface designed to explore automated classification of brain tumor MRI scans. Integrating two stages of convolutional neural networks (EfficientNet-B2), the tool classifies anomalies (Glioma, Meningioma, Pituitary) and evaluates severity subtypes, generating localized activation maps for radiologists.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h5 className="font-bold text-white text-[11px] uppercase tracking-wider text-violet-400 font-display">Core Objectives</h5>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>Deploy compound-scaled CNN backbones to achieve validation accuracy &gt; 95%.</li>
                <li>Implement GradCAM explainability boundaries to build visual trust.</li>
                <li>Design a decoupled, stateless REST API architecture for seamless backend integration.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1.5">
              <h5 className="font-bold text-white text-[11px] uppercase tracking-wider text-violet-400 font-display">Expected Outcomes</h5>
              <p className="text-slate-400">
                A functioning diagnostic exploration console allowing users to upload axial MRI slices, inspect spatial layers, edit observations, and download clinical-grade PDF reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2 & 3. Team & Supervisor Sections ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Project Team Members Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Users size={16} className="text-violet-400" /> Student Project Team
          </h3>
          <div className="flex flex-col gap-3 text-xs leading-normal">
            <div>
              <div className="text-sm font-semibold text-white">{student.name}</div>
              <div className="text-slate-500 font-mono mt-0.5">Roll Number: {student.rollNumber}</div>
            </div>
            <hr className="border-slate-800/60 my-1" />
            <div className="flex flex-col gap-1 text-slate-400">
              <div className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-violet-400" /> {student.college}
              </div>
              <div className="text-[11px] italic mt-0.5">{student.department}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{student.batch}</div>
            </div>
          </div>
        </div>

        {/* Supervisor/Guide Section Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Award size={16} className="text-violet-400" /> Research Supervisor
          </h3>
          <div className="flex flex-col gap-3 text-xs leading-normal">
            <div>
              <div className="text-sm font-semibold text-white">{supervisor.name}</div>
              <div className="text-slate-500 mt-0.5">{supervisor.designation}</div>
            </div>
            <hr className="border-slate-800/60 my-1" />
            <div className="flex flex-col gap-1 text-slate-400">
              <div className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-violet-400" /> {supervisor.department}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail size={13} className="text-violet-400" />
                <a href={`mailto:${supervisor.email}`} className="text-violet-400 hover:underline">{supervisor.email}</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Tech Stack Grids ──────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
          System Core Tech Stack
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techStack.map((stack, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-3 shadow-md hover:border-slate-700/80 transition-colors duration-250"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stack.category}
                </span>
                {stack.icon}
              </div>
              <ul className="flex flex-col gap-1">
                {stack.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-xs text-white flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5 & 6. Key Features & Citations ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Key Features List (Col 5) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h4 className="text-sm font-bold text-white font-display">Pipeline Milestones</h4>
          <ul className="flex flex-col gap-3 text-xs text-slate-400">
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 font-bold mt-0.5">✔</span>
              <span><strong>8-View TTA Augmentations:</strong> Eliminates rotation biases on validation datasets.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 font-bold mt-0.5">✔</span>
              <span><strong>Visual explainability Heatmaps:</strong> Exposes the target features driving classification.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 font-bold mt-0.5">✔</span>
              <span><strong>Stateless Backend design:</strong> Operates endpoints asynchronously using memory caching.</span>
            </li>
          </ul>
        </div>

        {/* References/Citations (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <BookOpen size={16} className="text-violet-400" /> Academic Citations
          </h4>
          <div className="flex flex-col gap-3 text-[11px] text-slate-400 leading-normal">
            {citations.map((cite, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="font-mono text-violet-400 font-bold flex-shrink-0">[{idx + 1}]</span>
                <p>
                  <strong>{cite.author}</strong>. <em>"{cite.title}."</em> {cite.journal}, {cite.year}.
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 7. Contact Information ───────────────────────────── */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-white">Project Correspondence Center</h4>
          <p className="text-xs text-slate-500">Contact developers regarding licensing, source repositories, or weights parameters.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            <span>project.support@college.edu</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-violet-400" />
            <span>+91-CS-DIVISION</span>
          </div>
        </div>
      </div>

    </div>
  );
}
