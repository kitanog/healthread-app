import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi, actionsApi } from '../api/client';
import {
  FileText,
  Plus,
  Calendar,
  Share2,
  Download,
  Trash2,
  Link,
  CheckCircle,
  Clock,
  Pill,
  Activity,
  Heart,
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, subDays } from 'date-fns';
import type { HealthReport } from '../types';

export default function Reports() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => sourcesApi.getReports(20),
  });

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Health Reports</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Generate and share reports with your healthcare providers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No reports yet</h3>
          <p className="text-gray-500 mb-6">
            Generate your first health report to share with your doctor
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Generate Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  onClick,
}: {
  report: HealthReport;
  onClick: () => void;
}) {
  const { report_data } = report;
  const isShared = !!report.share_token;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-soft p-4 sm:p-5 cursor-pointer card-hover"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base sm:text-lg">
              Health Report
            </h3>
            <p className="text-sm text-gray-500">
              {format(parseISO(report.date_range_start), 'MMM d')} -{' '}
              {format(parseISO(report.date_range_end), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">
              Generated {format(parseISO(report.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          {/* Summary Stats */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-primary-600">
                {report_data.summary?.active_medications || 0}
              </p>
              <p className="text-xs text-gray-500">Meds</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-warning-600">
                {report_data.summary?.total_symptoms || 0}
              </p>
              <p className="text-xs text-gray-500">Symptoms</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-success-600">
                {report_data.summary?.total_positive_effects || 0}
              </p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
          </div>

          {/* Share Status */}
          {isShared && (
            <div className="flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 rounded text-xs font-medium flex-shrink-0">
              <Link className="w-3 h-3" />
              Shared
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateReportModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includeAI, setIncludeAI] = useState(true);

  const createMutation = useMutation({
    mutationFn: actionsApi.generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date_range: { start: startDate, end: endDate },
      include_ai_insights: includeAI,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 animate-slide-up">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Generate Health Report</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-ai-50 border border-ai-200 rounded-lg">
            <input
              type="checkbox"
              id="includeAI"
              checked={includeAI}
              onChange={(e) => setIncludeAI(e.target.checked)}
              className="w-4 h-4 text-ai-500"
            />
            <label htmlFor="includeAI" className="flex-1">
              <p className="font-medium text-sm text-ai-800">Include AI Insights</p>
              <p className="text-xs text-ai-600">
                Get AI-generated health summaries and recommendations
              </p>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReportDetailModal({
  report,
  onClose,
}: {
  report: HealthReport;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { report_data } = report;

  const shareMutation = useMutation({
    mutationFn: () => actionsApi.shareReport(report.id, 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const copyShareLink = () => {
    const link = `${window.location.origin}/shared/${report.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Health Report</h2>
            <p className="text-sm text-gray-500">
              {format(parseISO(report.date_range_start), 'MMM d')} -{' '}
              {format(parseISO(report.date_range_end), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report.share_token ? (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-3 py-2 bg-success-100 text-success-700 rounded-lg text-sm font-medium"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            ) : (
              <button
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
              >
                <Share2 className="w-4 h-4" />
                Share Report
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {report_data.summary?.days_tracked || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Days Tracked</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-primary-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-primary-600">
                {report_data.summary?.active_medications || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Medications</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-warning-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-warning-600">
                {report_data.summary?.total_symptoms || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Symptoms</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-success-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-success-600">
                {report_data.summary?.total_positive_effects || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Positive</p>
            </div>
          </div>

          {/* Medications */}
          {report_data.medications?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary-500" />
                Medications
              </h3>
              <div className="space-y-2">
                {report_data.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-500">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>
                    {med.active && (
                      <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          {report_data.symptoms?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-warning-500" />
                Symptoms
              </h3>
              <div className="space-y-2">
                {report_data.symptoms.map((symptom, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{symptom.symptom_name}</span>
                      {symptom.matches_side_effect && (
                        <span className="flex items-center gap-1 text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          Side effect of {symptom.matched_medication}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{symptom.count}x</span>
                      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', `severity-${Math.round(symptom.avg_severity)}`)}>
                        Avg: {symptom.avg_severity.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive Effects */}
          {report_data.positive_effects?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-success-500" />
                Positive Effects
              </h3>
              <div className="space-y-2">
                {report_data.positive_effects.map((effect, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <span className="font-medium text-success-800">{effect.effect_name}</span>
                    <span className="text-sm text-success-600">{effect.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {report_data.ai_insights?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-ai-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">AI</span>
                </span>
                AI Insights
              </h3>
              <div className="space-y-3">
                {report_data.ai_insights.map((insight, i) => (
                  <div key={i} className="p-4 bg-ai-50 border border-ai-200 rounded-lg">
                    <p className="font-semibold text-ai-800">{insight.title}</p>
                    <p className="text-sm text-ai-700 mt-1">{insight.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
