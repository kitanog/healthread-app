import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi, actionsApi } from '../api/client';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

export default function Medications() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [expandedMed, setExpandedMed] = useState<string | null>(null);

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', showInactive],
    queryFn: () => sourcesApi.getMedications(!showInactive),
  });

  const { data: medicationNames = [] } = useQuery({
    queryKey: ['medicationNames'],
    queryFn: () => sourcesApi.getMedicationNames(),
  });

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications.filter((m) => !m.active);

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your medications and track side effects
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </div>

      {/* Add Medication Modal */}
      {showAddForm && (
        <AddMedicationModal
          medicationNames={medicationNames}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Active Medications */}
      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-4">
          Active Medications ({activeMeds.length})
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : activeMeds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-8 text-center">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active medications</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-primary-500 font-semibold hover:underline"
            >
              Add your first medication
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMeds.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                expanded={expandedMed === med.id}
                onToggle={() =>
                  setExpandedMed(expandedMed === med.id ? null : med.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Medications */}
      {inactiveMeds.length > 0 && (
        <div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            {showInactive ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              Past Medications ({inactiveMeds.length})
            </span>
          </button>
          {showInactive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              {inactiveMeds.map((med) => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  expanded={expandedMed === med.id}
                  onToggle={() =>
                    setExpandedMed(expandedMed === med.id ? null : med.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MedicationCard({
  medication,
  expanded,
  onToggle,
}: {
  medication: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();

  // First try to fetch by medication ID
  const { data: sideEffectsByID = [] } = useQuery({
    queryKey: ['sideEffects', medication.id],
    queryFn: () => sourcesApi.getMedicationSideEffects(medication.id),
    enabled: expanded,
  });

  // Also fetch by medication name as fallback
  const { data: sideEffectsByName = [] } = useQuery({
    queryKey: ['sideEffectsByName', medication.name],
    queryFn: () => sourcesApi.getSideEffectsByMedicationName(medication.name),
    enabled: expanded && sideEffectsByID.length === 0,
  });

  // Use whichever has results
  const sideEffects = sideEffectsByID.length > 0 ? sideEffectsByID : sideEffectsByName;

  const stopMutation = useMutation({
    mutationFn: () => actionsApi.stopMedication(medication.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{medication.name}</h3>
              {medication.generic_name && (
                <p className="text-xs text-gray-500">{medication.generic_name}</p>
              )}
            </div>
          </div>
          {medication.active && (
            <span className="px-2 py-1 bg-success-100 text-success-700 text-xs font-medium rounded">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Pill className="w-4 h-4" />
            <span>{medication.dosage}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{medication.frequency}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Started {format(parseISO(medication.start_date), 'MMM d, yyyy')}</span>
          </div>
          {medication.times?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{medication.times.join(', ')}</span>
            </div>
          )}
        </div>

        {medication.prescribed_for && (
          <p className="text-sm text-gray-500 mb-3">
            For: {medication.prescribed_for}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {expanded ? 'Hide' : 'View'} Side Effects
          </button>
          {medication.active && (
            <button
              onClick={() => {
                if (confirm('Stop this medication?')) {
                  stopMutation.mutate();
                }
              }}
              className="py-2 px-3 border border-gray-200 hover:border-danger-300 hover:bg-danger-50 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-danger-600"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Expanded Side Effects */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning-500" />
            Known Side Effects
          </h4>
          {sideEffects.length === 0 ? (
            <p className="text-sm text-gray-500">
              No known side effects in our database
            </p>
          ) : (
            <div className="space-y-2">
              {sideEffects.map((se: any) => (
                <div
                  key={se.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg"
                >
                  <span className="text-sm">{se.effect_name}</span>
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      se.frequency === 'common'
                        ? 'bg-red-100 text-red-700'
                        : se.frequency === 'uncommon'
                        ? 'bg-orange-100 text-orange-700'
                        : se.frequency === 'rare'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {se.frequency.replace('_', ' ')}
                    {se.frequency_percentage &&
                      ` (${Math.round(se.frequency_percentage * 100)}%)`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddMedicationModal({
  medicationNames,
  onClose,
}: {
  medicationNames: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [prescribedFor, setPrescribedFor] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addMutation = useMutation({
    mutationFn: actionsApi.addMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const filteredSuggestions = medicationNames.filter((n) =>
    n.toLowerCase().includes(name.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      name,
      dosage,
      frequency,
      start_date: startDate,
      prescribed_for: prescribedFor || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Add Medication</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Medication Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              placeholder="e.g., Metformin"
              required
            />
            {showSuggestions && filteredSuggestions.length > 0 && name && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setName(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              placeholder="e.g., 500mg"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              required
            >
              <option value="">Select frequency</option>
              <option value="once daily">Once daily</option>
              <option value="twice daily">Twice daily</option>
              <option value="three times daily">Three times daily</option>
              <option value="as needed">As needed</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          {/* Prescribed For */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prescribed For
            </label>
            <input
              type="text"
              value={prescribedFor}
              onChange={(e) => setPrescribedFor(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              placeholder="e.g., Type 2 Diabetes"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
