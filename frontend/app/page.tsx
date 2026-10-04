"use client";

import { useState, useEffect } from "react";
import { AlertCircle, FileText, UploadCloud, CheckCircle, XCircle, Edit3, Save, Download, HelpCircle } from "lucide-react";

export default function GrantAssistant() {
  const [files, setFiles] = useState<{ guideline: File | null; draft: File | null }>({ guideline: null, draft: null });
  const [metadata, setMetadata] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // App State
  const [analysis, setAnalysis] = useState<any>(null);
  const [isStale, setIsStale] = useState(false);
  
  // User Actions State
  const [userDecisions, setUserDecisions] = useState<Record<string, { state: 'confirmed' | 'rejected' | 'pending'; customQuote?: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // Mark as stale if files change after analysis
  useEffect(() => {
    if (analysis) setIsStale(true);
  }, [files.guideline, files.draft, metadata]);

  const handleUpload = async () => {
  if (!files.guideline || !files.draft) return alert("Upload both documents");
  setIsLoading(true);
  setIsStale(false);

  const formData = new FormData();
  formData.append("guideline", files.guideline);
  formData.append("draft", files.draft);
  formData.append("supporting_metadata", metadata);

  // Determine the base URL dynamically
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${API_BASE_URL}/api/extract-requirements`, { 
      method: "POST", 
      body: formData 
    });
    const data = await res.json();
      
      setAnalysis(data);
      
      // Initialize pending state
      const initialDecisions: any = {};
      const allReqs = [...(data.requirements.mandatory_requirements || []), ...(data.requirements.recommended_requirements || [])];
      allReqs.forEach(req => { initialDecisions[req.id] = { state: 'pending' }; });
      setUserDecisions(initialDecisions);
      setShowSummary(false);
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    }
    setIsLoading(false);
  };

  const handleDecision = (reqId: string, state: 'confirmed' | 'rejected') => {
    setUserDecisions(prev => ({ ...prev, [reqId]: { ...prev[reqId], state } }));
  };

  const saveCorrection = (reqId: string) => {
    setUserDecisions(prev => ({ ...prev, [reqId]: { state: 'confirmed', customQuote: editValue } }));
    setEditingId(null);
  };

  // Deterministic Math
  const mandatoryReqs = analysis?.requirements?.mandatory_requirements || [];
  const recommendedReqs = analysis?.requirements?.recommended_requirements || [];
  const confirmedMandatory = mandatoryReqs.filter((r: any) => userDecisions[r.id]?.state === 'confirmed').length;
  const score = mandatoryReqs.length > 0 ? Math.round((confirmedMandatory / mandatoryReqs.length) * 100) : 0;

  const renderBadge = (status: string) => {
    const styles: any = {
      strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
      weak: "bg-amber-100 text-amber-800 border-amber-200",
      ambiguous: "bg-orange-100 text-orange-800 border-orange-200",
      missing: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${styles[status] || styles.missing}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header & Disclaimer */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-blue-600" /> Grant Completeness Assistant
          </h1>
          <div className="flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-200 gap-1.5">
            <AlertCircle size={14} /> AI tool. Does not guarantee eligibility or funding.
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Application Inputs</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1 text-slate-700">1. Guideline Document (.txt,.pdf,.doc,.docx)</label>
                <input type="file" accept=".txt,.pdf,.doc,.docx"  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded" 
                  onChange={e => setFiles(f => ({ ...f, guideline: e.target.files?.[0] || null }))} />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">2. Draft Application (.txt,.pdf,.doc,.docx)</label>
                <input type="file" accept=".txt,.pdf,.doc,.docx" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded" 
                  onChange={e => setFiles(f => ({ ...f, draft: e.target.files?.[0] || null }))} />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">3. Supporting Documents Metadata (Optional)</label>
                <textarea 
                  className="w-full border border-slate-300 rounded p-2 h-24 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Attached: tax_return_2023.pdf, board_members.csv"
                  value={metadata} onChange={e => setMetadata(e.target.value)}
                />
              </div>
              <button onClick={handleUpload} disabled={isLoading} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50">
                {isLoading ? <span className="animate-pulse">Analyzing...</span> : <><UploadCloud size={18} /> Run AI Analysis</>}
              </button>
            </div>
          </div>

          {analysis && analysis.missing_docs.length > 0 && (
            <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
              <h3 className="font-semibold text-rose-800 flex items-center gap-2 mb-2"><AlertCircle size={18} /> Missing Required Documents</h3>
              <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1">
                {analysis.missing_docs.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Results & Interactive Mapping */}
        <div className="lg:col-span-8 space-y-6">
          {isStale && analysis && (
             <div className="bg-amber-100 p-4 rounded-xl border border-amber-300 text-amber-900 font-medium flex justify-between items-center shadow-sm">
                Inputs have changed. The assessment is stale. 
                <button onClick={handleUpload} className="bg-amber-600 text-white px-4 py-1.5 rounded shadow-sm hover:bg-amber-700 text-sm">Re-Run Analysis</button>
             </div>
          )}

          {analysis && (
            <>
              {/* Scorecard */}
              <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between ${isStale ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <h2 className="text-2xl font-bold">Mandatory Completion</h2>
                  <p className="text-slate-500 text-sm">Based strictly on human-confirmed mappings.</p>
                </div>
                <div className="text-5xl font-extrabold text-blue-600">{score}%</div>
              </div>

              {/* Requirements List */}
              <div className={`space-y-4 ${isStale ? 'opacity-50 pointer-events-none' : ''}`}>
                {[
                  { title: "Mandatory Requirements", reqs: mandatoryReqs },
                  { title: "Recommended Requirements", reqs: recommendedReqs }
                ].map(section => section.reqs.length > 0 && (
                  <div key={section.title} className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mt-8">{section.title}</h3>
                    {section.reqs.map((req: any) => {
                      const map = analysis.mappings.find((m: any) => m.req_id === req.id) || {};
                      const decision = userDecisions[req.id]?.state;
                      const customQuote = userDecisions[req.id]?.customQuote;
                      const evidenceToDisplay = customQuote || map.evidence_quote || "No evidence mapped.";

                      return (
                        <div key={req.id} className={`p-5 bg-white rounded-xl border shadow-sm transition-all ${
                          decision === 'confirmed' ? 'border-emerald-500 ring-1 ring-emerald-500' : 
                          decision === 'rejected' ? 'border-rose-300 opacity-60' : 'border-slate-200'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <h4 className="font-semibold text-slate-900 leading-snug">{req.text}</h4>
                              
                              {/* Evidence Area */}
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-slate-400 uppercase">Evidence</span>
                                  {!customQuote && map.status && renderBadge(map.status)}
                                  {customQuote && <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 rounded-full">MANUAL CORRECTION</span>}
                                </div>
                                
                                {editingId === req.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea className="w-full border rounded p-2 text-sm focus:ring focus:ring-blue-200" rows={3} value={editValue} onChange={e => setEditValue(e.target.value)} />
                                    <div className="flex gap-2">
                                      <button onClick={() => saveCorrection(req.id)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-700"><Save size={14}/> Save Correction</button>
                                      <button onClick={() => setEditingId(null)} className="text-slate-500 text-xs px-3 py-1.5 hover:bg-slate-100 rounded">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-700 italic">"{evidenceToDisplay}"</p>
                                )}
                              </div>

                              {/* AI Warnings */}
                              {map.unsupported_claim_warning && decision !== 'confirmed' && (
                                <div className="flex gap-2 text-sm text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                  <p><strong>Unsupported Claim:</strong> {map.unsupported_claim_warning}</p>
                                </div>
                              )}
                              {map.clarification_question && decision !== 'confirmed' && (
                                <div className="flex gap-2 text-sm text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                  <HelpCircle size={16} className="shrink-0 mt-0.5" />
                                  <p><strong>Clarification Needed:</strong> {map.clarification_question}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex flex-col gap-2 shrink-0 w-32">
                              <button onClick={() => handleDecision(req.id, 'confirmed')} className={`text-sm py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border transition-colors ${decision === 'confirmed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border-slate-300'}`}>
                                <CheckCircle size={16} /> Confirm
                              </button>
                              <button onClick={() => { setEditingId(req.id); setEditValue(evidenceToDisplay); }} className="text-sm py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-300 transition-colors">
                                <Edit3 size={16} /> Correct
                              </button>
                              <button onClick={() => handleDecision(req.id, 'rejected')} className={`text-sm py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border transition-colors ${decision === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 border-slate-300'}`}>
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Generate Summary Action */}
              {!isStale && (
                <div className="pt-8 border-t">
                  <button onClick={() => setShowSummary(true)} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                    <Download size={18} /> Generate Reviewed Summary
                  </button>

                  {showSummary && (
                    <div className="mt-6 p-6 bg-slate-800 text-slate-100 rounded-xl overflow-auto text-sm font-mono whitespace-pre-wrap">
                      {`GRANT REVIEW SUMMARY\n`}
                      {`====================\n`}
                      {`Mandatory Completion: ${score}%\n`}
                      {`Missing Required Documents: ${analysis.missing_docs.length}\n\n`}
                      {`CONFIRMED REQUIREMENTS:\n`}
                      {mandatoryReqs.filter((r: any) => userDecisions[r.id]?.state === 'confirmed').map((r: any) => `- ${r.text}\n`).join('')}
                      {`\nOUTSTANDING ISSUES / CLARIFICATIONS:\n`}
                      {analysis.mappings.filter((m: any) => userDecisions[m.req_id]?.state !== 'confirmed' && (m.clarification_question || m.unsupported_claim_warning)).map((m: any) => `- ${m.clarification_question || ''} ${m.unsupported_claim_warning || ''}\n`).join('')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}