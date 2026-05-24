import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, BookOpen, Brain, Clock, Award, BarChart3, Send, Copy, Check, Loader2, TrendingUp, Target, AlertCircle, RefreshCw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getTodayActivity, getWeekActivity, type ActivityEntry } from '../services/activityService';

interface ReportData {
  studentName: string;
  classLevel: string;
  subjects: string[];
  date: string;
  quizzes: { subject: string; topic: string; score: number; maxScore: number }[];
  chapters: { subject: string; topic: string }[];
  studyMinutes: number;
  avgScore: number;
  weekStreak: number;
}

function buildReport(entries: ActivityEntry[], name: string, classLevel: string, subjects: string[]): ReportData {
  const quizzes = entries
    .filter(e => e.type === 'quiz')
    .map(e => ({ subject: e.subject || '', topic: e.topic || '', score: e.score || 0, maxScore: e.maxScore || 5 }));
  const chapters = entries
    .filter(e => e.type === 'chapter')
    .map(e => ({ subject: e.subject || '', topic: e.topic || '' }));
  const studyMinutes = entries
    .filter(e => e.type === 'study_session')
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  const avgScore = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + (q.score / q.maxScore) * 100, 0) / quizzes.length)
    : 0;
  return {
    studentName: name,
    classLevel,
    subjects,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    quizzes,
    chapters,
    studyMinutes,
    avgScore,
    weekStreak: 0,
  };
}

function buildEmailHtml(report: ReportData, parentName: string): string {
  const scoreColor = report.avgScore >= 80 ? '#22c55e' : report.avgScore >= 60 ? '#f59e0b' : '#ef4444';
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,sans-serif}
.wrap{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden}
.header{background:linear-gradient(135deg,#0c4a6e,#0891b2);padding:32px;text-align:center}
.header h1{color:white;margin:0;font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase}
.header p{color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px}
.body{padding:32px}
.greeting{font-size:15px;color:#334155;margin-bottom:24px;line-height:1.6}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}
.stat{background:#f8fafc;border-radius:12px;padding:16px;text-align:center}
.stat-num{font-size:28px;font-weight:900;color:#0891b2}
.stat-lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.section{margin:20px 0}
.section-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:12px}
.item{padding:10px 14px;background:#f8fafc;border-radius:10px;margin-bottom:6px;font-size:13px;color:#334155;display:flex;justify-content:space-between;align-items:center}
.badge{padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase}
.footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:11px;color:#94a3b8}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Axyomis-X</h1>
    <p>Daily Learning Report — ${report.date}</p>
  </div>
  <div class="body">
    <p class="greeting">Dear ${parentName || 'Parent/Guardian'},<br><br>
    Here is today's learning summary for <strong>${report.studentName}</strong> (${report.classLevel}).</p>
    
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${report.quizzes.length}</div><div class="stat-lbl">Quizzes</div></div>
      <div class="stat"><div class="stat-num" style="color:${scoreColor}">${report.avgScore > 0 ? report.avgScore + '%' : '—'}</div><div class="stat-lbl">Avg Score</div></div>
      <div class="stat"><div class="stat-num">${report.studyMinutes > 0 ? report.studyMinutes + 'm' : report.chapters.length + ' ch'}</div><div class="stat-lbl">${report.studyMinutes > 0 ? 'Study Time' : 'Chapters'}</div></div>
    </div>

    ${report.quizzes.length > 0 ? `
    <div class="section">
      <div class="section-title">Quiz Results</div>
      ${report.quizzes.map(q => `
      <div class="item">
        <span>${q.topic} <span style="color:#94a3b8;font-size:11px">${q.subject}</span></span>
        <span class="badge" style="background:${(q.score/q.maxScore)>=0.8?'#dcfce7':((q.score/q.maxScore)>=0.6?'#fef9c3':'#fee2e2')};color:${(q.score/q.maxScore)>=0.8?'#16a34a':((q.score/q.maxScore)>=0.6?'#d97706':'#dc2626')}">${q.score}/${q.maxScore}</span>
      </div>`).join('')}
    </div>` : ''}

    ${report.chapters.length > 0 ? `
    <div class="section">
      <div class="section-title">Chapters Studied</div>
      ${report.chapters.map(c => `
      <div class="item">
        <span>${c.topic}</span>
        <span class="badge" style="background:#e0f2fe;color:#0369a1">${c.subject}</span>
      </div>`).join('')}
    </div>` : ''}

    ${report.quizzes.length === 0 && report.chapters.length === 0 ? `
    <div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px;color:#94a3b8;font-size:13px">
      No activity recorded today. Encourage your student to open Axyomis-X!
    </div>` : ''}

    <div style="margin-top:24px;padding:16px;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border-radius:12px;font-size:13px;color:#334155">
      <strong>Keep it up!</strong> Consistency is the key to mastery. Even 20 minutes of daily study builds a powerful foundation.
    </div>
  </div>
  <div class="footer">
    This report was automatically generated by Axyomis-X · <a href="#" style="color:#0891b2">Unsubscribe</a>
  </div>
</div>
</body></html>`;
}

function buildTextReport(report: ReportData, parentName: string): string {
  return `AXYOMIS-X DAILY REPORT — ${report.date}

Dear ${parentName || 'Parent/Guardian'},

Learning summary for ${report.studentName} (${report.classLevel}).

TODAY'S STATS:
• Quizzes completed: ${report.quizzes.length}
• Average score: ${report.avgScore > 0 ? report.avgScore + '%' : 'N/A'}
• Chapters studied: ${report.chapters.length}
• Study time: ${report.studyMinutes > 0 ? report.studyMinutes + ' minutes' : 'Not recorded'}

${report.quizzes.length > 0 ? `QUIZ RESULTS:\n${report.quizzes.map(q => `  ${q.topic} (${q.subject}): ${q.score}/${q.maxScore}`).join('\n')}` : ''}

${report.chapters.length > 0 ? `CHAPTERS STUDIED:\n${report.chapters.map(c => `  ${c.topic} — ${c.subject}`).join('\n')}` : ''}

Report generated by Axyomis-X`;
}

export const ParentReport: React.FC = () => {
  const { uid, displayName, classLevel, subjects, parentInfo, isPremium, isTrialActive } = useUser() as any;
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const canAccess = isPremium || isTrialActive;

  const loadReport = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const entries = await getTodayActivity(uid);
      const report = buildReport(
        entries,
        displayName || 'Student',
        classLevel || 'Unknown',
        subjects || []
      );
      setReportData(report);
    } catch {}
    setLoading(false);
  }, [uid, displayName, classLevel, subjects]);

  useEffect(() => {
    if (uid && canAccess) loadReport();
  }, [uid, canAccess]);

  const handleSendEmail = async () => {
    if (!reportData || !parentInfo?.email) return;
    setSending(true);
    setError('');
    try {
      const html = buildEmailHtml(reportData, parentInfo.name);
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: parentInfo.email,
          parentName: parentInfo.name,
          studentName: reportData.studentName,
          reportHtml: html,
          reportText: buildTextReport(reportData, parentInfo.name),
        }),
      });
      const data = await res.json() as any;
      if (data.success) {
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      } else {
        setError(data.message || 'Email sending failed. Copy the report instead.');
      }
    } catch {
      setError('Could not reach the server. Copy the report to share manually.');
    }
    setSending(false);
  };

  const handleCopy = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(buildTextReport(reportData, parentInfo?.name || ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!uid) return null;

  if (!canAccess) {
    return (
      <section id="parent-report" className="max-w-7xl mx-auto px-8 mb-24">
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-base mb-1">Daily Parent Report</h3>
            <p className="text-slate-500 text-sm">Email a daily progress summary to your parent/guardian. Available on Premium plan.</p>
          </div>
          <a href="#premium-section" className="ml-auto px-5 py-2.5 bg-cyan-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 transition-colors flex-shrink-0">
            Upgrade
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="parent-report" className="max-w-7xl mx-auto px-4 sm:px-8 mb-24">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-blue-500" />
        <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Parent Report</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Mail className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Daily Summary</span>
        </div>
      </div>
      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-8">
        Send today's learning summary to {parentInfo?.name || 'your parent'} · {parentInfo?.email || 'No email set'}
      </p>

      {!parentInfo?.email ? (
        <div className="p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">No parent email set</p>
            <p className="text-slate-500 text-xs">Add parent info during onboarding or in your profile settings.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report preview card */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/40 px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black uppercase tracking-wider text-sm">Today's Report</h3>
                  <p className="text-slate-400 text-[10px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <button onClick={loadReport} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : reportData ? (
              <div className="p-6 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Brain className="w-4 h-4 text-purple-400" />, label: 'Quizzes', value: reportData.quizzes.length },
                    { icon: <Award className="w-4 h-4 text-amber-400" />, label: 'Avg Score', value: reportData.avgScore > 0 ? reportData.avgScore + '%' : '—' },
                    { icon: <BookOpen className="w-4 h-4 text-cyan-400" />, label: 'Chapters', value: reportData.chapters.length },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex justify-center mb-1">{s.icon}</div>
                      <div className="text-lg font-black text-white">{s.value}</div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-widest">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Activity lists */}
                {reportData.quizzes.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Quiz Results</p>
                    <div className="space-y-1.5">
                      {reportData.quizzes.map((q, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <div>
                            <span className="text-[11px] font-bold text-white">{q.topic}</span>
                            <span className="text-[10px] text-slate-500 ml-2">{q.subject}</span>
                          </div>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${(q.score / q.maxScore) >= 0.8 ? 'bg-green-500/10 text-green-400' : (q.score / q.maxScore) >= 0.6 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                            {q.score}/{q.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportData.chapters.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Chapters Studied</p>
                    <div className="space-y-1.5">
                      {reportData.chapters.map((c, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-[11px] font-bold text-white">{c.topic}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">{c.subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportData.quizzes.length === 0 && reportData.chapters.length === 0 && (
                  <div className="text-center py-8 text-slate-600">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">No activity today yet</p>
                    <p className="text-[10px] mt-1 opacity-70">Activity will appear here as you study</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Send controls */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Send to Parent</span>
              </div>
              <p className="text-slate-400 text-xs mb-4">
                Sending to: <span className="text-white font-bold">{parentInfo?.email}</span>
              </p>
              <button
                onClick={handleSendEmail}
                disabled={sending || !reportData}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] hover:from-blue-400 hover:to-cyan-400 disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : sent ? (
                  <><Check className="w-4 h-4" /> Sent!</>
                ) : (
                  <><Send className="w-4 h-4" /> Email Report Now</>
                )}
              </button>
              {error && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[10px] text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Copy Report Text</span>
              </div>
              <p className="text-slate-600 text-xs mb-4">Copy as plain text to share via WhatsApp, SMS, or any messaging app.</p>
              <button
                onClick={handleCopy}
                disabled={!reportData}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Text Report</>}
              </button>
            </div>

            <div className="p-5 rounded-3xl relative overflow-hidden border border-white/5 bg-white/[0.01]">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-500/10 blur-[30px] rounded-full" />
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">Coming Soon</span>
              </div>
              <p className="text-white font-bold text-sm relative z-10">WhatsApp Reports</p>
              <p className="text-slate-500 text-xs relative z-10 mt-0.5">Automatic daily WhatsApp messages to parents · Elite plan · Coming in next update</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
