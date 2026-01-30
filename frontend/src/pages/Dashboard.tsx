import { useQuery } from '@tanstack/react-query';
import { sourcesApi } from '../api/client';
import {
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => sourcesApi.getDashboard(14),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 sm:mb-8"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 sm:h-80 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-danger-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, trends, side_effect_alerts, recent_activity, medications } = data;

  // Format trend data for chart
  const chartData = trends.map((t) => ({
    date: format(parseISO(t.date), 'MMM d'),
    symptoms: t.symptoms,
    positive: t.positive_effects,
  }));

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Your health overview for the last 14 days</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon={Heart}
          iconColor="text-success-500"
          iconBg="bg-success-100"
          label="Positive Effects"
          value={stats.positive_effects_count}
          trend={stats.positive_effects_trend}
          trendLabel="vs last period"
        />
        <StatCard
          icon={Activity}
          iconColor="text-warning-500"
          iconBg="bg-warning-100"
          label="Symptoms Logged"
          value={stats.symptoms_count}
          trend={stats.symptoms_trend}
          trendLabel="vs last period"
          invertTrend
        />
        <StatCard
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-100"
          label="Today's Calories"
          value={stats.todays_calories}
          subtitle={`${stats.foods_logged_today} meals logged`}
        />
        <StatCard
          icon={Pill}
          iconColor="text-primary-500"
          iconBg="bg-primary-100"
          label="Active Meds"
          value={stats.active_medications}
        />
        <StatCard
          icon={UtensilsCrossed}
          iconColor="text-red-500"
          iconBg="bg-red-100"
          label="Food Reactions"
          value={stats.foods_with_reactions}
          subtitle="in last 14 days"
        />
        <StatCard
          icon={Calendar}
          iconColor="text-accent-500"
          iconBg="bg-accent-100"
          label="Days Tracked"
          value={stats.days_tracked}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart - 2 columns on desktop */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <h2 className="font-semibold text-lg mb-4">Health Trends</h2>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="positive"
                  name="Positive"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="symptoms"
                  name="Symptoms"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={{ fill: '#D97706', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Effect Alerts */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Side Effect Alerts</h2>
            <AlertTriangle className="w-5 h-5 text-warning-500" />
          </div>
          {side_effect_alerts.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-success-300" />
              <p className="text-sm">No side effect matches detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {side_effect_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-3 bg-warning-50 border border-warning-200 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-warning-800 truncate">
                        {alert.symptom}
                      </p>
                      <p className="text-xs text-warning-600 mt-0.5">
                        Matches {alert.frequency} side effect of {alert.medication}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
          {recent_activity.length === 0 ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recent_activity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={clsx(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      activity.type === 'positive_effect'
                        ? 'bg-success-100'
                        : 'bg-warning-100'
                    )}
                  >
                    {activity.type === 'positive_effect' ? (
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-success-500" />
                    ) : (
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {activity.severity && (
                    <span
                      className={clsx(
                        'px-2 py-1 rounded text-xs font-medium flex-shrink-0',
                        `severity-${activity.severity}`
                      )}
                    >
                      {activity.severity}/5
                    </span>
                  )}
                  {activity.matches_side_effect && (
                    <AlertTriangle className="w-4 h-4 text-warning-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Medications */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6">
          <h2 className="font-semibold text-lg mb-4">Active Medications</h2>
          {medications.length === 0 ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No active medications</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{med.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {med.dosage} · {med.frequency}
                    </p>
                  </div>
                  {med.times && med.times.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {med.times.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  trend?: number;
  trendLabel?: string;
  invertTrend?: boolean;
  subtitle?: string;
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  trendLabel,
  invertTrend,
  subtitle,
}: StatCardProps) {
  const isPositive = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) > 0;

  return (
    <div className="bg-white rounded-xl shadow-soft p-3 sm:p-5 card-hover">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={clsx('p-2 sm:p-2.5 rounded-lg', iconBg)}>
          <Icon className={clsx('w-4 h-4 sm:w-5 sm:h-5', iconColor)} />
        </div>
        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-[10px] sm:text-xs font-medium',
              isPositive ? 'text-success-600' : 'text-danger-600'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{label}</p>
      {trendLabel && <p className="text-[10px] sm:text-xs text-gray-400 mt-1 hidden sm:block">{trendLabel}</p>}
      {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-1 hidden sm:block">{subtitle}</p>}
    </div>
  );
}
