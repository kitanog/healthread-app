import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi, actionsApi } from '../api/client';
import {
  Activity,
  Heart,
  Clock,
  FileText,
  Pill,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type EntryType = 'symptom' | 'positive_effect';

const severityLabels = ['Minimal', 'Mild', 'Moderate', 'Significant', 'Severe'];
const severityColors = [
  'bg-success-100 border-success-300 text-success-700',
  'bg-yellow-100 border-yellow-300 text-yellow-700',
  'bg-orange-100 border-orange-300 text-orange-700',
  'bg-red-100 border-red-300 text-red-700',
  'bg-danger-100 border-danger-300 text-danger-700',
];

export default function LogEntry() {
  const queryClient = useQueryClient();
  const [entryType, setEntryType] = useState<EntryType>('symptom');
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState(2);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customTime, setCustomTime] = useState(format(new Date(), 'HH:mm'));

  // Fetch medications
  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => sourcesApi.getMedications(true),
  });

  // Fetch suggestions
  const { data: symptomSuggestions = [] } = useQuery({
    queryKey: ['symptomSuggestions', name],
    queryFn: () => sourcesApi.getSymptomSuggestions(name),
    enabled: entryType === 'symptom' && name.length > 0,
  });

  const { data: effectSuggestions = [] } = useQuery({
    queryKey: ['effectSuggestions', name],
    queryFn: () => sourcesApi.getPositiveEffectSuggestions(name),
    enabled: entryType === 'positive_effect' && name.length > 0,
  });

  // Fetch side effects for selected medications
  const { data: sideEffects = [] } = useQuery({
    queryKey: ['sideEffects', selectedMeds],
    queryFn: async () => {
      if (selectedMeds.length === 0) return [];
      const effects = await Promise.all(
        selectedMeds.map((id) => sourcesApi.getMedicationSideEffects(id))
      );
      return effects.flat();
    },
    enabled: selectedMeds.length > 0,
  });

  // Mutations
  const symptomMutation = useMutation({
    mutationFn: actionsApi.logSymptom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const effectMutation = useMutation({
    mutationFn: actionsApi.logPositiveEffect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['positiveEffects'] });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const resetForm = () => {
    setName('');
    setSeverity(2);
    setDuration('');
    setNotes('');
    setSelectedMeds([]);
    setUseCustomTime(false);
    setCustomDate(format(new Date(), 'yyyy-MM-dd'));
    setCustomTime(format(new Date(), 'HH:mm'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build timestamp if custom time is used
    const timestamp = useCustomTime 
      ? new Date(`${customDate}T${customTime}`).toISOString()
      : undefined;

    if (entryType === 'symptom') {
      symptomMutation.mutate({
        symptom_name: name,
        severity,
        duration_minutes: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
        timestamp,
        associated_medication_ids: selectedMeds,
      });
    } else {
      effectMutation.mutate({
        effect_name: name,
        notes: notes || undefined,
        timestamp,
        associated_medication_ids: selectedMeds,
      });
    }
  };

  const suggestions = entryType === 'symptom' ? symptomSuggestions : effectSuggestions;
  const isLoading = symptomMutation.isPending || effectMutation.isPending;

  // Check if current symptom matches a known side effect
  const matchingSideEffects = sideEffects.filter(
    (se) => se.effect_name.toLowerCase().includes(name.toLowerCase()) && name.length > 2
  );

  return (
    <div className="animate-fade-in pb-8">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-success-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-50">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Entry logged successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Log Entry</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Track your side effects or positive changes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
            {/* Entry Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you logging?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEntryType('symptom')}
                  className={clsx(
                    'p-3 sm:p-4 rounded-lg border-2 flex items-center gap-2 sm:gap-3 transition-all',
                    entryType === 'symptom'
                      ? 'border-warning-500 bg-warning-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className={clsx(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      entryType === 'symptom' ? 'bg-warning-200' : 'bg-gray-100'
                    )}
                  >
                    <Activity
                      className={clsx(
                        'w-4 h-4 sm:w-5 sm:h-5',
                        entryType === 'symptom' ? 'text-warning-600' : 'text-gray-500'
                      )}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Symptom</p>
                    <p className="text-xs text-gray-500 hidden sm:block">Log a symptom or side effect</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('positive_effect')}
                  className={clsx(
                    'p-3 sm:p-4 rounded-lg border-2 flex items-center gap-2 sm:gap-3 transition-all',
                    entryType === 'positive_effect'
                      ? 'border-success-500 bg-success-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className={clsx(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      entryType === 'positive_effect' ? 'bg-success-200' : 'bg-gray-100'
                    )}
                  >
                    <Heart
                      className={clsx(
                        'w-4 h-4 sm:w-5 sm:h-5',
                        entryType === 'positive_effect' ? 'text-success-600' : 'text-gray-500'
                      )}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Positive</p>
                    <p className="text-xs text-gray-500 hidden sm:block">Log an improvement</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {entryType === 'symptom' ? 'Symptom Name' : 'Effect Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors text-base"
                placeholder={
                  entryType === 'symptom'
                    ? 'e.g., Nausea, Fatigue, Constipation'
                    : 'e.g., Reduced appetite, More energy, Better sleep'
                }
                required
              />
              {/* Suggestions */}
              {suggestions.length > 0 && name.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setName(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date/Time Picker */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  When did this occur?
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomTime}
                    onChange={(e) => setUseCustomTime(e.target.checked)}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className="text-gray-600">Set custom time</span>
                </label>
              </div>
              
              {useCustomTime ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Using current time: {format(new Date(), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </div>

            {/* Severity (symptoms only) */}
            {entryType === 'symptom' && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level
                </label>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {severityLabels.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSeverity(i + 1)}
                      className={clsx(
                        'py-2 sm:py-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all',
                        severity === i + 1
                          ? severityColors[i]
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                  <span>Minimal</span>
                  <span>Severe</span>
                </div>
              </div>
            )}

            {/* Duration (symptoms only) */}
            {entryType === 'symptom' && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) - Optional
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                    placeholder="How long did it last?"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Associated Medications */}
            {medications.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Medications
                </label>
                <div className="flex flex-wrap gap-2">
                  {medications.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() =>
                        setSelectedMeds((prev) =>
                          prev.includes(med.id)
                            ? prev.filter((id) => id !== med.id)
                            : [...prev, med.id]
                        )
                      }
                      className={clsx(
                        'px-3 py-2 rounded-lg border-2 text-sm font-medium flex items-center gap-2 transition-all',
                        selectedMeds.includes(med.id)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Pill className="w-4 h-4" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{med.name}</span>
                      {selectedMeds.includes(med.id) && (
                        <X className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes - Optional
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Add any additional context..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !name}
              className={clsx(
                'w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                entryType === 'symptom'
                  ? 'bg-warning-500 text-white hover:bg-warning-600'
                  : 'bg-success-500 text-white hover:bg-success-600'
              )}
            >
              {isLoading ? 'Saving...' : `Log ${entryType === 'symptom' ? 'Symptom' : 'Positive Effect'}`}
            </button>
          </form>
        </div>

        {/* Side Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Side Effect Match Alert */}
          {matchingSideEffects.length > 0 && entryType === 'symptom' && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-warning-800 text-sm">
                    Known Side Effect Match
                  </p>
                  <p className="text-xs text-warning-600 mt-1">
                    "{name}" matches known side effects:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {matchingSideEffects.slice(0, 3).map((se) => (
                      <li key={se.id} className="text-xs text-warning-700">
                        • {se.medication_name} ({se.frequency.replace('_', ' ')})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Known Side Effects Panel */}
          {selectedMeds.length > 0 && sideEffects.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft p-4">
              <h3 className="font-semibold text-sm mb-3">
                Known Side Effects
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sideEffects.slice(0, 10).map((se) => (
                  <div
                    key={se.id}
                    className={clsx(
                      'p-2 rounded-lg text-xs',
                      name.toLowerCase().includes(se.effect_name.toLowerCase())
                        ? 'bg-warning-50 border border-warning-200'
                        : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{se.effect_name}</span>
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          se.frequency === 'common'
                            ? 'bg-red-100 text-red-700'
                            : se.frequency === 'uncommon'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {se.frequency.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">{se.medication_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-primary-50 rounded-xl p-4">
            <h3 className="font-semibold text-primary-800 text-sm mb-2">
              Logging Tips
            </h3>
            <ul className="text-xs text-primary-700 space-y-1.5">
              <li>• Log GLP-1 side effects as they happen</li>
              <li>• Track nausea timing relative to injections</li>
              <li>• Note what helps reduce side effects</li>
              <li>• Record positive changes like appetite reduction</li>
              <li>• Link entries to your GLP-1 medication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
