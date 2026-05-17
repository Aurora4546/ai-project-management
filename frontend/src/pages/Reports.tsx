import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { Layout } from '../components/Layout'
import { generateProjectReport, downloadProjectReportPdf, getReportHistory, deleteReport as deleteReportApi, getReportById } from '../services/api'
import type { IReport } from '../types'
import { ReportDetailsModal } from '../components/ReportDetailsModal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Color Palette ─────────────────────────────────
const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#64748b'
]

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#22c55e'
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#3b82f6',
  LOWEST: '#94a3b8'
}

// ── Helpers ─────────────────────────────────
const formatMapToChartData = (map: Record<string, number>) =>
  Object.entries(map).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }))

const formatLabel = (key: string) =>
  key.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── Custom Tooltip ─────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700">
      <p className="font-bold mb-0.5">{label || payload[0]?.name}</p>
      <p className="text-slate-300">{payload[0]?.value} issues</p>
    </div>
  )
}

// ── Shimmer Skeleton ─────────────────────────────────
const ShimmerCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-4/6" />
    </div>
  </div>
)

const ShimmerStat = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <div className="h-6 bg-slate-200 rounded w-12 mb-1.5" />
        <div className="h-2 bg-slate-100 rounded w-20" />
      </div>
    </div>
  </div>
)

// ── Main Component ─────────────────────────────────
export const Reports = (): React.ReactElement => {
  const { id: projectId } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [report, setReport] = useState<IReport | null>(null)
  const [reportHistory, setReportHistory] = useState<IReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'total' | 'completed' | 'open' | 'overdue' | 'unassigned' | 'messages' | null>(null)
  const [reportToDelete, setReportToDelete] = useState<IReport | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Load report history on mount
  useEffect(() => {
    if (!projectId) return
    setIsLoadingHistory(true)
    getReportHistory(projectId)
      .then(history => {
        setReportHistory(history)
        if (history.length > 0) {
          handleSelectReport(history[0])
        }
      })
      .catch(err => {
        console.error('Failed to load report history:', err)
        const status = err?.response?.status
        const serverMessage = err?.response?.data?.message
        if (status === 403) {
          // Silently handle — user may not be a PM
        } else if (serverMessage) {
          setError(serverMessage)
        } else if (!err?.response) {
          setError('Unable to connect to the server. Please check your network connection.')
        } else {
          setError('Failed to load report history. Please try again.')
        }
      })
      .finally(() => setIsLoadingHistory(false))
  }, [projectId])

  const handleGenerate = async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await generateProjectReport(projectId)
      setReport(data)
      showToast("Report generated successfully!", "success")
      // Prepend to history
      setReportHistory(prev => [data, ...prev])
    } catch (err: any) {
      const status = err?.response?.status
      const serverMessage = err?.response?.data?.message

      if (status === 403) {
        setError(serverMessage || 'You do not have permission to generate reports for this project.')
      } else if (status === 500) {
        setError(serverMessage || 'The report generation encountered a server error. Please try again later.')
      } else if (status === 404) {
        setError('Project not found. Please verify the project exists and try again.')
      } else if (!err?.response) {
        setError('Unable to connect to the server. Please check your network connection and try again.')
      } else {
        setError(serverMessage || `Report generation failed (Error ${status || 'unknown'}). Please try again.`)
      }
      showToast(serverMessage || "Failed to generate report", "error")
      console.error('Report generation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectReport = async (selected: IReport) => {
    if (!projectId || !selected.id) return
    if (report?.id === selected.id) return
    
    setIsReportLoading(true)
    setIsHistoryOpen(false) // Close history on mobile after selection
    try {
      const fullReport = await getReportById(projectId, selected.id)
      setReport(fullReport)
    } catch (err) {
      console.error('Failed to load report details:', err)
      showToast("Failed to load report details", "error")
      // Fallback to summary data from history list
      setReport(selected)
    } finally {
      setIsReportLoading(false)
    }
  }

  const handleDeleteReport = (selectedReport: IReport, e: React.MouseEvent) => {
    e.stopPropagation()
    setReportToDelete(selectedReport)
  }

  const handleConfirmDelete = async () => {
    if (!projectId || !reportToDelete?.id) return

    try {
      await deleteReportApi(projectId, reportToDelete.id)
      showToast("Report deleted successfully!", "success")
      
      const deletedId = reportToDelete.id
      setReportHistory(prev => prev.filter(r => r.id !== deletedId))
      
      if (report?.id === deletedId) {
        const remaining = reportHistory.filter(r => r.id !== deletedId)
        setReport(remaining.length > 0 ? remaining[0] : null)
      }
    } catch (err) {
      console.error('Failed to delete report:', err)
      showToast("Failed to delete report", "error")
    } finally {
      setReportToDelete(null)
    }
  }

  const handleDownloadPdf = async () => {
    if (!projectId || !report?.id) return
    setIsDownloading(true)
    try {
      const blob = await downloadProjectReportPdf(projectId, report.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report?.projectKey || 'Project'}_Report.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Chart data
  const statusData = useMemo(() =>
    report ? formatMapToChartData(report.issuesByStatus) : [], [report])
  const priorityData = useMemo(() =>
    report ? formatMapToChartData(report.issuesByPriority) : [], [report])
  const typeData = useMemo(() =>
    report ? formatMapToChartData(report.issuesByType) : [], [report])
  const assigneeData = useMemo(() =>
    report ? formatMapToChartData(report.issuesByAssignee) : [], [report])

  const completionRate = useMemo(() => {
    if (!report || report.totalIssues === 0) return 0
    return Math.round((report.completedIssues / report.totalIssues) * 100)
  }, [report])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Layout projectContextName={report?.projectName || 'AI Reports'}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden font-inter relative">
        {/* ── Report History Sidebar ── */}
        <div className={`
          ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          absolute md:relative z-30 md:z-auto w-72 flex-none bg-slate-50 border-r border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none transition-transform duration-300
        `}>
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-indigo-500">history</span>
                Report History
              </h2>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {reportHistory.length}
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                {isLoading ? 'progress_activity' : 'auto_awesome'}
              </span>
              {isLoading ? 'Generating...' : 'New AI Report'}
            </button>
          </div>

          {/* Report list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingHistory ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
              ))
            ) : reportHistory.length === 0 ? (
              <div className="text-center py-12 px-4">
                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">description</span>
                <p className="text-xs text-slate-400">No reports yet.</p>
                <p className="text-xs text-slate-400">Generate your first AI report above.</p>
              </div>
            ) : (
              reportHistory.map((r) => {
                const isActive = report?.id === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${isActive
                      ? 'bg-white shadow-md border border-indigo-200 ring-1 ring-indigo-100'
                      : 'hover:bg-white hover:shadow-sm border border-transparent'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`material-symbols-outlined text-[14px] ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                            article
                          </span>
                          <span className={`text-[12px] font-bold truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {formatDate(r.generatedAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 ml-5">
                          {formatTime(r.generatedAt)} • {r.generatedByName || 'PM'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 ml-5">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {r.completedIssues}/{r.totalIssues} done
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {r.totalMessages} msgs
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteReport(r, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"
                        title="Delete report"
                      >
                        <span className="material-symbols-outlined text-[14px] text-slate-400 hover:text-red-500 transition-colors">delete</span>
                      </button>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Mobile Backdrop for Sidebar */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* ── Main Content Area ── */}
        <div className="flex-1 overflow-y-auto pt-6 px-4 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-[11px] font-bold text-slate-400 tracking-[0.1em] mb-3 uppercase flex items-center gap-2 min-w-0">
              <span className="shrink-0">PROJECTS /</span>
              <span className="truncate" title={report?.projectName}>{report?.projectName || 'Reports'}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-3 md:gap-4">
                {/* Mobile Sidebar Toggle */}
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 -ml-2 -mt-1 text-slate-400 hover:text-slate-600 md:hidden flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                    aria-label="Open report history"
                >
                    <span className="material-symbols-outlined text-[26px]">menu_open</span>
                </button>
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 md:gap-4">
                    <span className="material-symbols-outlined text-[28px] md:text-[36px] text-indigo-500">analytics</span>
                    AI Project Reports
                  </h1>
                  <p className="text-[13px] md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                    Generate intelligent project analysis powered by Google Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {report && (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isDownloading ? 'hourglass_empty' : 'download'}
                    </span>
                    {isDownloading ? 'Exporting...' : 'Export PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-red-500 mt-0.5">error</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Shimmer / Skeleton Loader — only during main loading or first lazy load */}
          {(isLoading || (isReportLoading && !report)) && (
            <div className="space-y-6">
              {/* Only show AI Banner during NEW report generation */}
              {isLoading && (
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[24px] animate-pulse">neurology</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">AI is analyzing your project...</h3>
                      <p className="text-white/80 text-sm mt-0.5">
                        Reading chat history, analyzing issues, and generating insights. This may take 15-30 seconds.
                      </p>
                    </div>
                  </div>
                  {/* Animated progress bar */}
                  <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                      style={{ width: '60%', animation: 'shimmer 2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}

              {/* Skeleton Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <ShimmerStat key={i} />)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}
              </div>
            </div>
          )}

          {/* Empty State — only when no history */}
          {!report && !isLoading && !error && !isLoadingHistory && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
                <span className="material-symbols-outlined text-[44px] text-indigo-500">insights</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">No report generated yet</h2>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                Click "New AI Report" in the sidebar to analyze your project's chat history, issues, and team activity.
                The AI will provide insights, statistics, and actionable recommendations.
              </p>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                Generate AI Report
              </button>
            </div>
          )}

          {/* Report Content */}
          {report && !isLoading && (
            <div className={`space-y-6 pb-12 transition-opacity duration-300 ${isReportLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {/* Report Timestamp */}
              <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>
                  Generated on {new Date(report?.generatedAt || '').toLocaleString()} 
                  {report?.generatedByName && <> by {report.generatedByName}</>}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <StatCard
                  value={report.totalIssues}
                  label="Total Issues"
                  icon="assignment"
                  color="indigo"
                  onClick={() => { setModalType('total'); setIsModalOpen(true) }}
                />
                <StatCard
                  value={report.completedIssues}
                  label="Completed"
                  icon="task_alt"
                  color="emerald"
                  onClick={() => { setModalType('completed'); setIsModalOpen(true) }}
                />
                <StatCard
                  value={report.totalIssues - report.completedIssues}
                  label="Open Issues"
                  icon="pending"
                  color="amber"
                  onClick={() => { setModalType('open'); setIsModalOpen(true) }}
                />
                <StatCard
                  value={report.overdueIssues || 0}
                  label="Overdue"
                  icon="schedule"
                  color="red"
                  onClick={() => { setModalType('overdue'); setIsModalOpen(true) }}
                />
                <StatCard
                  value={report.unassignedIssues || 0}
                  label="Unassigned"
                  icon="person_off"
                  color="slate"
                  onClick={() => { setModalType('unassigned'); setIsModalOpen(true) }}
                />
                <StatCard
                  value={report.totalMessages}
                  label="Chat Messages"
                  icon="forum"
                  color="blue"
                  onClick={() => { setModalType('messages'); setIsModalOpen(true) }}
                />
              </div>

              {/* Completion Rate Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">Project Completion</p>
                    <p className="text-4xl font-black tracking-tight">{completionRate}%</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {report.completedIssues} of {report.totalIssues} issues completed
                    </p>
                  </div>
                  <div className="w-32 h-32 relative">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#completionGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${completionRate * 2.51} 251`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-indigo-400">trending_up</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Narrative Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <NarrativeCard
                  title="Executive Summary"
                  content={report.executiveSummary}
                  icon="summarize"
                  accentColor="indigo"
                />
                <NarrativeCard
                  title="Accomplishments"
                  content={report.accomplishments}
                  icon="emoji_events"
                  accentColor="emerald"
                />
                <NarrativeCard
                  title="Blockers & Risks"
                  content={report.blockers}
                  icon="warning"
                  accentColor="red"
                />
                <NarrativeCard
                  title="Recommended Next Steps"
                  content={report.nextSteps}
                  icon="rocket_launch"
                  accentColor="amber"
                />
              </div>

              {/* Team Dynamics — Full Width */}
              <NarrativeCard
                title="Team Dynamics & Collaboration"
                content={report.teamDynamics}
                icon="group"
                accentColor="violet"
              />

              {/* New Comprehensive Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <NarrativeCard
                  title="Sprint Health"
                  content={report.sprintHealth}
                  icon="monitor_heart"
                  accentColor="teal"
                />
                <NarrativeCard
                  title="Velocity Analysis"
                  content={report.velocityAnalysis}
                  icon="speed"
                  accentColor="blue"
                />
              </div>

              {/* Risk Assessment — Full Width */}
              <NarrativeCard
                title="Risk Assessment"
                content={report.riskAssessment}
                icon="shield"
                accentColor="orange"
              />

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Issues by Status — Donut Chart */}
                <ChartCard title="Issues by Status" icon="donut_small">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name.replace(/ /g, '_').toUpperCase()] || CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs font-medium text-slate-600">{formatLabel(value)}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Issues by Priority — Donut Chart */}
                <ChartCard title="Issues by Priority" icon="priority_high">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PRIORITY_COLORS[entry.name.toUpperCase()] || CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs font-medium text-slate-600">{formatLabel(value)}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Issues by Type — Bar Chart */}
                <ChartCard title="Issues by Type" icon="category">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={typeData} barSize={32}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatLabel}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {typeData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Issues by Assignee — Bar Chart */}
                <ChartCard title="Workload by Assignee" icon="person">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={assigneeData} barSize={32} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {assigneeData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Report Footer */}
              <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
                Report generated on {new Date(report.generatedAt).toLocaleString()} • Powered by Google Gemini AI
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(-100%); }
      `}
      </style>
      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId!}
        report={report}
        reportType={modalType}
      />
      <DeleteConfirmModal
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={reportToDelete ? `Report from ${formatDate(reportToDelete.generatedAt)}` : ''}
      />
    </Layout>
  )
}

// ── Sub-Components ─────────────────────────────────

const ACCENT_MAP: Record<string, { bg: string, text: string, icon: string, border: string, dot: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500', border: 'border-indigo-200', dot: '#6366f1' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-200', dot: '#10b981' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500', border: 'border-red-200', dot: '#ef4444' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-200', dot: '#f59e0b' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500', border: 'border-violet-200', dot: '#8b5cf6' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-200', dot: '#3b82f6' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'text-teal-500', border: 'border-teal-200', dot: '#14b8a6' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-orange-200', dot: '#f97316' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'text-slate-500', border: 'border-slate-200', dot: '#64748b' },
}

interface StatCardProps {
  value: number
  label: string
  icon: string
  color: string
  onClick?: () => void
}

const StatCard = ({ value, label, icon, color, onClick }: StatCardProps) => {
  const accent = ACCENT_MAP[color] || ACCENT_MAP.indigo
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-4 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-slate-300 hover:-translate-y-1' : 'hover:shadow-lg hover:border-slate-300'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 flex-shrink-0 ${accent.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform overflow-visible`}>
          <span className={`material-symbols-outlined text-[16px] ${accent.icon} flex items-center justify-center leading-none`}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-wider uppercase truncate">{label}</p>
        </div>
      </div>
    </div>
  )
}

interface NarrativeCardProps {
  title: string
  content: string
  icon: string
  accentColor: string
}

const NarrativeCard = ({ title, content, icon, accentColor }: NarrativeCardProps) => {
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.indigo

  const renderMarkdownContent = (text: string) => {
    if (!text) return <p className="text-slate-400 italic text-[13px]">No data available.</p>

    // Preprocess: clean up raw status enums
    const cleanedText = text
      .replace(/(?<![a-zA-Z0-9])IN[_-]PROGRESS(?![a-zA-Z0-9])/gi, 'In Progress')
      .replace(/(?<![a-zA-Z0-9])IN PROGRESS(?![a-zA-Z0-9])/gi, 'In Progress')
      .replace(/(?<![a-zA-Z0-9])IN[_-]REVIEW(?![a-zA-Z0-9])/gi, 'In Review')
      .replace(/(?<![a-zA-Z0-9])IN REVIEW(?![a-zA-Z0-9])/gi, 'In Review')
      .replace(/(?<![a-zA-Z0-9])TODO(?![a-zA-Z0-9])/gi, 'To Do')
      .replace(/(?<![a-zA-Z0-9])DONE(?![a-zA-Z0-9])/gi, 'Done')

    // Normalize: collapse multiple blank lines into one, identify leading space indentation
    const rawLines = cleanedText.split('\n')
    const lines: { text: string; indent: number }[] = []
    let lastWasEmpty = false
    for (const raw of rawLines) {
      const trimmed = raw.trim()
      if (!trimmed) {
        if (!lastWasEmpty && lines.length > 0) {
          lines.push({ text: '', indent: 0 })
          lastWasEmpty = true
        }
        continue
      }
      // Count leading spaces of the raw line to determine nesting level
      const leadingSpaces = raw.match(/^(\s*)/)?.[0].length || 0
      lines.push({ text: trimmed, indent: leadingSpaces })
      lastWasEmpty = false
    }

    const elements: React.ReactNode[] = []
    let listItems: React.ReactNode[] = []
    let key = 0

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key++} className="space-y-1.5 my-2">
            {listItems}
          </ul>
        )
        listItems = []
      }
    }

    const formatInline = (line: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      // Match **bold**, __bold__, *italic*, `code`
      const regex = /(\*\*(.+?)\*\*|__(.+?)__|`(.+?)`|\*(.+?)\*)/g
      let lastIndex = 0
      let match

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index))
        }
        if (match[2] || match[3]) {
          parts.push(<strong key={`b${key}-${match.index}`} className="font-semibold text-slate-800">{match[2] || match[3]}</strong>)
        } else if (match[4]) {
          parts.push(
            <code key={`c${key}-${match.index}`} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">
              {match[4]}
            </code>
          )
        } else if (match[5]) {
          parts.push(<em key={`i${key}-${match.index}`} className="italic text-slate-500">{match[5]}</em>)
        }
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }

      return parts.length > 0 ? parts : [line]
    }

    for (const line of lines) {
      // Spacer between groups (from collapsed blank lines)
      if (!line.text) {
        flushList()
        continue
      }

      // Headers (### or ##) — render as a small bold label
      const headerMatch = line.text.match(/^(#{1,3})\s+(.+)/)
      if (headerMatch) {
        flushList()
        const headerText = headerMatch[2].replace(/\*\*/g, '')
        elements.push(
          <p key={key++} className="text-[13px] font-bold text-slate-700 mt-3 mb-1">
            {headerText}
          </p>
        )
        continue
      }

      // Bullet list items (-, *, •)
      const bulletMatch = line.text.match(/^[-*•]\s+(.+)/)
      if (bulletMatch) {
        const bulletText = bulletMatch[1]
        const isNested = line.indent > 0
        const isDeeplyNested = line.indent >= 4

        // Apply indentation styling
        const indentClass = isDeeplyNested ? 'pl-8' : (isNested ? 'pl-4' : '')
        // Custom dot styling for nested lists
        const dotBg = isNested ? '#94a3b8' : accent.dot

        listItems.push(
          <li key={key++} className={`flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed ${indentClass}`}>
            <span className="rounded-full shrink-0"
              style={{ width: isNested ? '4px' : '6px', height: isNested ? '4px' : '6px', marginTop: isNested ? '8px' : '6px', backgroundColor: dotBg }} />
            <span>{formatInline(bulletText)}</span>
          </li>
        )
        continue
      }

      // Numbered list items (1., 2.) — render same as bullets for consistency
      const numberedMatch = line.text.match(/^(\d+)[.)]\s+(.+)/)
      if (numberedMatch) {
        const numberedText = numberedMatch[2]
        const isNested = line.indent > 0
        const isDeeplyNested = line.indent >= 4

        const indentClass = isDeeplyNested ? 'pl-8' : (isNested ? 'pl-4' : '')
        const dotBg = isNested ? '#94a3b8' : accent.dot

        listItems.push(
          <li key={key++} className={`flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed ${indentClass}`}>
            <span className="rounded-full shrink-0"
              style={{ width: isNested ? '4px' : '6px', height: isNested ? '4px' : '6px', marginTop: isNested ? '8px' : '6px', backgroundColor: dotBg }} />
            <span>{formatInline(numberedText)}</span>
          </li>
        )
        continue
      }

      // Regular paragraph line
      flushList()
      elements.push(
        <p key={key++} className="text-[13px] text-slate-600 leading-relaxed">
          {formatInline(line.text)}
        </p>
      )
    }

    flushList()
    return elements
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 ${accent.bg} rounded-lg flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-[16px] ${accent.icon}`}>{icon}</span>
        </div>
        <h3 className="font-bold text-[13px] text-slate-800">{title}</h3>
      </div>
      <div>
        {renderMarkdownContent(content)}
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  icon: string
  children: React.ReactNode
}

const ChartCard = ({ title, icon, children }: ChartCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
        <span className="material-symbols-outlined text-[18px] text-slate-500">{icon}</span>
      </div>
      <h3 className="font-bold text-sm text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
)
