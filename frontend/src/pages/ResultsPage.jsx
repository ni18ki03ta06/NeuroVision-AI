import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Award, ShieldCheck, Zap, Activity, Cpu, Calendar, Database, Layers } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
    fetch(`${apiBaseUrl}/performance-metrics`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load metrics");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-violet-500">
        <div className="spinner" />
        <span className="text-sm font-semibold">Loading model telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/40 border border-red-800/60 text-red-400 p-6 rounded-2xl text-center max-w-lg mx-auto">
        <p className="font-semibold text-sm">Failed to load performance metrics</p>
        <p className="text-xs text-slate-500 mt-2">{error || "Empty data payload"}</p>
      </div>
    );
  }

  const overall = data.overall;
  const modelInfo = data.model_info;
  const classWise = data.class_wise;
  const confMatrix = data.confusion_matrix;
  const labels = data.labels;
  const history = data.training_history;
  const rocCurves = data.roc_curves;
  const distribution = data.data_distribution;
  const confidenceHist = data.confidence_histogram;

  // Colors for charts
  const COLORS = ['#7c3aed', '#a78bfa', '#38bdf8', '#fb923c', '#f87171', '#4ade80'];

  const getCellBg = (val, maxVal = 400) => {
    const ratio = Math.min(val / maxVal, 1.0);
    return `rgba(124, 58, 237, ${0.05 + ratio * 0.75})`;
  };

  return (
    <div className="flex flex-col gap-10 text-slate-200">
      
      {/* ── 1. Accuracy Metrics Cards ────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
          Overall Accuracy Metrics
        </h3>
        <MetricsCard 
          accuracy={overall.accuracy}
          precision={overall.precision}
          recall={overall.recall}
          f1Score={overall.f1_score}
        />
      </div>

      {/* ── 4. Model Information & Configuration Panel ───────── */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
          Model Specifications & Metadata
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Architecture</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Layers size={14} className="text-violet-400" /> {modelInfo.architecture.split(" ")[0]}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Parameters</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Activity size={14} className="text-emerald-400" /> {modelInfo.total_params.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Train Dataset Size</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Database size={14} className="text-sky-400" /> {modelInfo.train_dataset_size} slices
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Dataset Size</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Database size={14} className="text-sky-400" /> {modelInfo.test_dataset_size} slices
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Training Time</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Calendar size={14} className="text-amber-400" /> {modelInfo.training_time}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hardware Target</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <Cpu size={14} className="text-violet-400" /> {modelInfo.hardware.split(" ")[1]}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2 & 5. Performance Table & Data Distribution ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Class-wise Performance Table (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Class-wise Evaluation Breakdown</h4>
            <p className="text-[11px] text-slate-500 mt-1">Classification metrics computed on hold-out testing subsets</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5">Class Name</th>
                  <th className="py-2.5 text-center">Precision</th>
                  <th className="py-2.5 text-center">Recall</th>
                  <th className="py-2.5 text-center">F1-Score</th>
                  <th className="py-2.5 text-center">Accuracy</th>
                  <th className="py-2.5 text-right">Test Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {classWise.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/20">
                    <td className="py-3 font-semibold text-white">{row.name}</td>
                    <td className="py-3 text-center">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center">{(row.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center">{(row.f1 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center">{(row.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right font-mono text-slate-450">{row.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Distribution Pie Chart (Col 5) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Training Dataset Distribution</h4>
            <p className="text-[11px] text-slate-500 mt-1">Proportion of scan slices allocated during classifier training</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#07090e', borderColor: '#30363d', borderRadius: '8px', fontSize: '11px', color: '#c9d1d9' }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: '#8b949e', paddingLeft: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 3. Visualizations (Confusion Matrix & Accuracy Bars) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 4x4 Confusion Matrix (Col 5) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Confusion Matrix Heatmap</h4>
            <p className="text-[11px] text-slate-500 mt-1">True Classes (Rows) vs Predicted Classes (Columns)</p>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-xs select-none">
              <thead>
                <tr>
                  <th className="p-2 border-b border-slate-800 text-slate-500 text-left">T \ P</th>
                  {labels.map((lbl, idx) => (
                    <th key={idx} className="p-2 border-b border-slate-800 text-white font-semibold text-center">{lbl.slice(0,4)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMatrix.map((row, r_idx) => (
                  <tr key={r_idx}>
                    <td className="p-2.5 border-b border-slate-800/50 text-white font-semibold">{labels[r_idx]}</td>
                    {row.map((val, c_idx) => {
                      const maxRowVal = Math.max(...row);
                      return (
                        <td
                          key={c_idx}
                          style={{ background: getCellBg(val, maxRowVal) }}
                          className={`p-2.5 border-b border-slate-800/50 text-center transition-colors duration-150 ${r_idx === c_idx ? 'font-bold text-white' : 'text-slate-500'}`}
                          title={`True: ${labels[r_idx]} | Pred: ${labels[c_idx]} = ${val}`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-class Accuracy Bars & Histogram (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-6">
          
          {/* Accuracy Bars */}
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-bold text-white font-display">Per-Class Accuracy Comparison</h4>
              <p className="text-[11px] text-slate-500 mt-1">Individual correct detection ratios per scan subclass</p>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classWise} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 9 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100)}%`} />
                  <Tooltip 
                    formatter={(val) => [`${(val * 100).toFixed(1)}%`, 'Accuracy']}
                    contentStyle={{ backgroundColor: '#07090e', borderColor: '#30363d', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {classWise.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* ── 3 & 5. Training History curves & Histogram ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Training Curves (Col 6) */}
        <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Loss & Accuracy Training Curves</h4>
            <p className="text-[11px] text-slate-500 mt-1">Plotting validation iterations over 15 epochs</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="epoch" stroke="#6b7280" tick={{ fontSize: 9 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#07090e', borderColor: '#30363d', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="loss" stroke="#f87171" strokeWidth={2} dot={false} name="Train Loss" />
                <Line type="monotone" dataKey="val_loss" stroke="#fb923c" strokeWidth={2} dot={false} name="Val Loss" />
                <Line type="monotone" dataKey="acc" stroke="#4ade80" strokeWidth={2} dot={false} name="Train Acc" />
                <Line type="monotone" dataKey="val_acc" stroke="#38bdf8" strokeWidth={2} dot={false} name="Val Acc" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curves (Col 6) */}
        <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Receiver Operating Characteristic (ROC)</h4>
            <p className="text-[11px] text-slate-500 mt-1">Sensitivity (TPR) vs False Positive Rate (FPR) curves</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurves} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="fpr" stroke="#6b7280" tick={{ fontSize: 9 }} domain={[0, 1]} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 9 }} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#07090e', borderColor: '#30363d', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="glioma" stroke="#7c3aed" strokeWidth={2} dot={false} name="Glioma (AUC: 0.94)" />
                <Line type="monotone" dataKey="meningioma" stroke="#fb923c" strokeWidth={2} dot={false} name="Meningioma (AUC: 0.91)" />
                <Line type="monotone" dataKey="notumor" stroke="#4ade80" strokeWidth={2} dot={false} name="Normal (AUC: 0.99)" />
                <Line type="monotone" dataKey="pituitary" stroke="#38bdf8" strokeWidth={2} dot={false} name="Pituitary (AUC: 0.98)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 5. Confidence Score Histogram ────────────────────── */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display">Confidence Score Distribution</h4>
          <p className="text-[11px] text-slate-500 mt-1">Histogram demonstrating the density of prediction confidences</p>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceHist} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="range" stroke="#6b7280" tick={{ fontSize: 9 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 9 }} />
              <Tooltip 
                formatter={(val) => [val, 'Count']}
                contentStyle={{ backgroundColor: '#07090e', borderColor: '#30363d', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
