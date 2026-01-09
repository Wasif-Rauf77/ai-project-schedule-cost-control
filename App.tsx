
import React, { useState, useMemo, useCallback } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  BarChart3, FileText, Settings2, Loader2, Info, ChevronRight, Calculator,
  BookOpen, History, Layers, ShieldAlert, Zap
} from 'lucide-react';
import { EVMMetrics, EVMResults, AnalysisResponse, ChartDataPoint, ManagementConstraints } from './types';
import { getPMAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<EVMMetrics>({
    pv: 100000,
    ev: 85000,
    ac: 95000,
    bac: 250000,
    totalDurationDays: 180,
    elapsedDays: 60,
  });

  const [constraints, setConstraints] = useState<ManagementConstraints>({
    deadlineFixed: false,
    maxBudgetIncreasePercent: 10
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const results = useMemo((): EVMResults => {
    const sv = metrics.ev - metrics.pv;
    const spi = metrics.pv === 0 ? 1 : metrics.ev / metrics.pv;
    const cv = metrics.ev - metrics.ac;
    const cpi = metrics.ac === 0 ? 1 : metrics.ev / metrics.ac;
    
    const eac = cpi === 0 ? metrics.bac : metrics.bac / cpi;
    const etc = eac - metrics.ac;
    const vac = metrics.bac - eac;
    
    const workRemaining = metrics.bac - metrics.ev;
    const fundsRemaining = metrics.bac - metrics.ac;
    const tcpi = fundsRemaining <= 0 ? (workRemaining > 0 ? 9.99 : 0) : workRemaining / fundsRemaining;

    const estimatedCompletionDays = spi === 0 ? metrics.totalDurationDays : metrics.totalDurationDays / spi;
    const scheduleVarianceDays = estimatedCompletionDays - metrics.totalDurationDays;

    return {
      sv, spi, cv, cpi, eac, etc, vac, tcpi,
      estimatedCompletionDays, scheduleVarianceDays
    };
  }, [metrics]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const points: ChartDataPoint[] = [];
    const steps = 10;
    const stepDays = metrics.elapsedDays / steps;
    
    for (let i = 0; i <= steps; i++) {
      const currentDay = Math.round(i * stepDays);
      const ratio = i / steps;
      points.push({
        day: currentDay,
        pv: Math.round(metrics.pv * ratio),
        ev: Math.round(metrics.ev * ratio),
        ac: Math.round(metrics.ac * ratio),
      });
    }
    return points;
  }, [metrics]);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await getPMAnalysis(metrics, results, constraints);
      setAnalysis(result);
    } catch (error) {
      alert("Failed to generate analysis. Please ensure API Key is valid.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [metrics, results, constraints]);

  const loadCaseStudy = (caseId: 'schedule' | 'financial' | 'integrated' | 'whatif') => {
    setAnalysis(null);
    if (caseId === 'schedule') {
      setMetrics({ pv: 90000, ev: 72000, ac: 80000, bac: 250000, totalDurationDays: 180, elapsedDays: 90 });
    } else if (caseId === 'financial') {
      setMetrics({ pv: 150000, ev: 150000, ac: 180000, bac: 250000, totalDurationDays: 180, elapsedDays: 100 });
    } else if (caseId === 'integrated') {
      setMetrics({ pv: 150000, ev: 130000, ac: 160000, bac: 300000, totalDurationDays: 200, elapsedDays: 100 });
    } else {
      setMetrics({ pv: 150000, ev: 117000, ac: 142000, bac: 300000, totalDurationDays: 200, elapsedDays: 110 });
      setConstraints({ deadlineFixed: true, maxBudgetIncreasePercent: 5 });
    }
  };

  const handleInputChange = (field: keyof EVMMetrics, value: string) => {
    const num = parseFloat(value) || 0;
    setMetrics(prev => ({ ...prev, [field]: num }));
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-700 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calculator size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PROJECT CONTROL DASHBOARD</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">PMBOK® 8th Ed. Certified Analysis</p>
            </div>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all rounded-md font-bold text-sm shadow-lg shadow-blue-900/40"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
            <span>{isAnalyzing ? 'PROCESSING...' : 'ANALYZE DATA'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
              <BookOpen size={18} className="text-blue-600" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Load Case Studies</h2>
            </div>
            <div className="p-3 grid grid-cols-1 gap-2">
              <CaseButton onClick={() => loadCaseStudy('schedule')} title="Schedule Variance Case" sub="SPI: 0.80" />
              <CaseButton onClick={() => loadCaseStudy('financial')} title="Financial Overrun Case" sub="CPI: 0.83" />
              <CaseButton onClick={() => loadCaseStudy('integrated')} title="Integrated Control Case" sub="Dual Underperformance" />
              <button 
                onClick={() => loadCaseStudy('whatif')}
                className="flex items-center justify-between p-3 text-left bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ShieldAlert size={14} className="text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-purple-900">What-if: Hard Constraints</p>
                    <p className="text-[10px] text-purple-600">Fixed Deadline | 5% Budget Cap</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-purple-400 group-hover:text-purple-600" />
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
              <Settings2 size={18} className="text-slate-600" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Inputs</h2>
            </div>
            <div className="p-5 space-y-4">
              <MetricInput label="Planned Value (PV)" value={metrics.pv} onChange={(v) => handleInputChange('pv', v)} icon="$" />
              <MetricInput label="Earned Value (EV)" value={metrics.ev} onChange={(v) => handleInputChange('ev', v)} icon="$" />
              <MetricInput label="Actual Cost (AC)" value={metrics.ac} onChange={(v) => handleInputChange('ac', v)} icon="$" />
              <MetricInput label="Budget at Completion (BAC)" value={metrics.bac} onChange={(v) => handleInputChange('bac', v)} icon="$" />
              <div className="grid grid-cols-2 gap-4">
                <MetricInput label="Total Days" value={metrics.totalDurationDays} onChange={(v) => handleInputChange('totalDurationDays', v)} icon="d" />
                <MetricInput label="Days Elapsed" value={metrics.elapsedDays} onChange={(v) => handleInputChange('elapsedDays', v)} icon="d" />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center space-x-2">
              <Zap size={18} className="text-yellow-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Management Constraints</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fixed Deadline</label>
                <button 
                  onClick={() => setConstraints(c => ({...c, deadlineFixed: !c.deadlineFixed}))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${constraints.deadlineFixed ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${constraints.deadlineFixed ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Budget Increase (%)</label>
                <input 
                  type="number"
                  value={constraints.maxBudgetIncreasePercent}
                  onChange={(e) => setConstraints(c => ({...c, maxBudgetIncreasePercent: parseFloat(e.target.value) || 0}))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <BarChart3 size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Performance Trend Analysis</h2>
              </div>
              <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5" /> PV</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-1.5" /> EV</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-1.5" /> AC</span>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorAc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="pv" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPv)" strokeWidth={3} />
                  <Area type="monotone" dataKey="ev" stroke="#22c55e" fillOpacity={1} fill="url(#colorEv)" strokeWidth={3} />
                  <Area type="monotone" dataKey="ac" stroke="#ef4444" fillOpacity={1} fill="url(#colorAc)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusCard label="Cost Performance (CPI)" value={results.cpi.toFixed(2)} status={results.cpi >= 1 ? 'good' : (results.cpi > 0.85 ? 'warning' : 'bad')} desc={results.cpi >= 1 ? 'Within Budget' : 'Over Budget'} />
            <StatusCard label="Schedule Performance (SPI)" value={results.spi.toFixed(2)} status={results.spi >= 1 ? 'good' : (results.spi > 0.85 ? 'warning' : 'bad')} desc={results.spi >= 1 ? 'On Schedule' : 'Behind Schedule'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center space-x-2"><History size={14} /><span>Variances</span></h3>
              <div className="space-y-5">
                <VarianceItem label="Cost Variance (CV)" value={results.cv} />
                <VarianceItem label="Schedule Variance (SV)" value={results.sv} />
                <VarianceItem label="Variance at Completion (VAC)" value={results.vac} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center space-x-2"><Info size={14} /><span>Forecasting</span></h3>
              <div className="space-y-5">
                <ForecastItem label="EAC (Forecast Cost)" value={`$${results.eac.toLocaleString()}`} />
                <ForecastItem label="ETC (Funds Needed)" value={`$${results.etc.toLocaleString()}`} />
                <ForecastItem label="TCPI (Needed Efficiency)" value={results.tcpi.toFixed(2)} highlighted={results.tcpi > 1.1} />
              </div>
            </div>
          </div>

          {analysis && (
            <section className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-blue-400" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest">Formal PMBOK Control Report</h2>
                    <p className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">Status: Analysis Complete</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <span className="text-[9px] font-black uppercase text-slate-400">Feasibility:</span>
                    <span className={`text-[10px] font-black ${analysis.feasibilityScore > 70 ? 'text-emerald-400' : analysis.feasibilityScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {analysis.feasibilityScore}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-10">
                <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Management Verdict</h3>
                  <p className="text-sm font-bold text-blue-900 leading-tight">"{analysis.managementVerdict}"</p>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em] border-l-4 border-slate-300 pl-3">Executive Summary</h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{analysis.executiveSummary}</p>
                </section>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em] border-l-4 border-slate-300 pl-3">Variance Deep Dive</h3>
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line text-justify">{analysis.varianceAnalysis}</p>
                  </section>
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-[10px] font-black text-red-500 uppercase mb-4 tracking-[0.2em] border-l-4 border-red-500 pl-3">Corrective Risks</h3>
                      <div className="grid gap-3">
                        {analysis.riskIdentification.map((risk, i) => (
                          <div key={i} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-red-900 font-medium leading-tight">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-[0.2em] border-l-4 border-emerald-500 pl-3">Strategic Recovery</h3>
                      <div className="grid gap-3">
                        {analysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-emerald-900 font-medium leading-tight">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center space-x-2"><ChevronRight size={14} /><span>PMBOK Reference: {analysis.pmbokReference}</span></div>
                  <span className="font-mono opacity-50">Confidential Analyst Report</span>
                </div>
              </div>
            </section>
          )}

          {!analysis && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400">
              <TrendingUp size={48} className="mb-4 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest mb-1">System Idle</p>
              <p className="text-[10px]">Enter data or load a scenario to start simulation</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-slate-200">
              <Loader2 className="animate-spin text-blue-600 mb-6" size={56} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Processing What-if Logic</h3>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-medium">Evaluating constraints against SPI/CPI performance metrics...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// UI Components
const CaseButton: React.FC<{ onClick: () => void; title: string; sub: string }> = ({ onClick, title, sub }) => (
  <button onClick={onClick} className="flex items-center justify-between p-3 text-left bg-white hover:bg-blue-50 border border-slate-100 rounded-lg transition-colors group">
    <div><p className="text-xs font-bold text-slate-800">{title}</p><p className="text-[10px] text-slate-500">{sub}</p></div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
  </button>
);

const MetricInput: React.FC<{ label: string; value: number; onChange: (v: string) => void; icon: string }> = ({ label, value, onChange, icon }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-slate-400 font-mono text-xs group-focus-within:text-blue-500">{icon}</span></div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="block w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
    </div>
  </div>
);

const StatusCard: React.FC<{ label: string; value: string; status: 'good' | 'bad' | 'warning'; desc: string }> = ({ label, value, status, desc }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-5 group hover:border-blue-200 transition-colors">
    <div className={`p-4 rounded-2xl ${status === 'good' ? 'bg-emerald-50 text-emerald-600' : status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
      {status === 'good' ? <CheckCircle size={22} /> : status === 'warning' ? <AlertCircle size={22} /> : <TrendingDown size={22} />}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-800 tabular-nums">{value}</h3>
      <div className="flex items-center mt-1">
        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
        <p className={`text-[10px] font-bold uppercase tracking-tight ${status === 'good' ? 'text-emerald-600' : status === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>{desc}</p>
      </div>
    </div>
  </div>
);

const VarianceItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between items-center group">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-700 transition-colors">{label}</span>
    <span className={`text-xs font-mono font-black py-1 px-2 rounded ${value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {value >= 0 ? '+' : ''}{value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
    </span>
  </div>
);

const ForecastItem: React.FC<{ label: string; value: string; highlighted?: boolean }> = ({ label, value, highlighted }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
    <span className={`text-xs font-mono font-black ${highlighted ? 'text-amber-600' : 'text-slate-800'}`}>{value}</span>
  </div>
);

export default App;
