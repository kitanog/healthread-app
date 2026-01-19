import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { actionsApi } from '../api/client';
import {
  User,
  Heart,
  Ruler,
  Scale,
  Droplet,
  AlertTriangle,
  Phone,
  Save,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';
import type { UserProfileUpdate } from '../types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const [formData, setFormData] = useState<UserProfileUpdate>({
    name: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    height_cm: undefined,
    weight_kg: undefined,
    allergies: [],
    medical_conditions: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        blood_type: user.blood_type || '',
        height_cm: user.height_cm || undefined,
        weight_kg: user.weight_kg || undefined,
        allergies: user.allergies || [],
        medical_conditions: user.medical_conditions || [],
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: actionsApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies?.includes(newAllergy.trim())) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((a) => a !== allergy),
    });
  };

  const addCondition = () => {
    if (newCondition.trim() && !formData.medical_conditions?.includes(newCondition.trim())) {
      setFormData({
        ...formData,
        medical_conditions: [...(formData.medical_conditions || []), newCondition.trim()],
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setFormData({
      ...formData,
      medical_conditions: formData.medical_conditions?.filter((c) => c !== condition),
    });
  };

  // Calculate BMI
  const bmi = formData.height_cm && formData.weight_kg
    ? (formData.weight_kg / Math.pow(formData.height_cm / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="animate-fade-in pb-8">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-success-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-50">
          <CheckCircle className="w-5 h-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Profile & Baseline</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage your personal information and baseline health metrics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Personal Information</h2>
              <p className="text-sm text-gray-500">Basic profile details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none bg-white"
              >
                <option value="">Select...</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Physical Metrics */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Physical Metrics</h2>
              <p className="text-sm text-gray-500">Baseline health measurements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Droplet className="w-4 h-4" />
                  Blood Type
                </div>
              </label>
              <select
                value={formData.blood_type || ''}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none bg-white"
              >
                <option value="">Select...</option>
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  Height (cm)
                </div>
              </label>
              <input
                type="number"
                value={formData.height_cm || ''}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g., 175"
                min="50"
                max="300"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Scale className="w-4 h-4" />
                  Weight (kg)
                </div>
              </label>
              <input
                type="number"
                value={formData.weight_kg || ''}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g., 70"
                min="20"
                max="500"
                step="0.1"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BMI (calculated)
              </label>
              <div className={clsx(
                'w-full px-4 py-2.5 border-2 rounded-lg',
                bmi ? 'border-gray-200 bg-gray-50' : 'border-dashed border-gray-300 bg-gray-50'
              )}>
                {bmi ? (
                  <span className={clsx(
                    'font-semibold',
                    parseFloat(bmi) < 18.5 ? 'text-warning-600' :
                    parseFloat(bmi) < 25 ? 'text-success-600' :
                    parseFloat(bmi) < 30 ? 'text-warning-600' : 'text-danger-600'
                  )}>
                    {bmi}
                  </span>
                ) : (
                  <span className="text-gray-400">Enter height & weight</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Medical Information</h2>
              <p className="text-sm text-gray-500">Allergies and conditions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  placeholder="Add allergy..."
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.allergies?.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-warning-100 text-warning-700 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:text-warning-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
                {(!formData.allergies || formData.allergies.length === 0) && (
                  <span className="text-sm text-gray-400">No allergies added</span>
                )}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                  placeholder="Add condition..."
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.medical_conditions?.map((condition) => (
                  <span
                    key={condition}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeCondition(condition)}
                      className="hover:text-primary-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
                {(!formData.medical_conditions || formData.medical_conditions.length === 0) && (
                  <span className="text-sm text-gray-400">No conditions added</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-danger-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Emergency Contact</h2>
              <p className="text-sm text-gray-500">Person to contact in case of emergency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
