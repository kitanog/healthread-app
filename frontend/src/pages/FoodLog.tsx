import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi, actionsApi } from '../api/client';
import type { FoodLog, MealCategory, ReferenceFood, DailyNutritionSummary, FoodReactionSummary } from '../types';
import {
  UtensilsCrossed,
  Plus,
  Clock,
  Flame,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Apple,
  Coffee,
  Pizza,
  Salad,
  Pill,
  Search,
  TrendingUp,
  Target,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

const MEAL_ICONS: Record<MealCategory, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Salad,
  dinner: Pizza,
  snack: Apple,
  beverage: Coffee,
  supplement: Pill,
};

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  beverage: 'Beverage',
  supplement: 'Supplement',
};

const DIET_TAG_LABELS: Record<string, string> = {
  keto: 'Keto',
  low_carb: 'Low Carb',
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  paleo: 'Paleo',
  mediterranean: 'Mediterranean',
  gluten_free: 'Gluten Free',
  dairy_free: 'Dairy Free',
  low_sodium: 'Low Sodium',
  diabetic_friendly: 'Diabetic Friendly',
};

export default function FoodLogPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealCategory | 'all'>('all');
  const [showNutrition, setShowNutrition] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const { data: foodLogs = [], isLoading } = useQuery({
    queryKey: ['foodLogs', selectedMeal],
    queryFn: () => sourcesApi.getFoodLogs(30, 100, selectedMeal === 'all' ? undefined : selectedMeal),
  });

  const { data: nutritionSummary = [] } = useQuery({
    queryKey: ['nutritionSummary'],
    queryFn: () => sourcesApi.getDailyNutrition(7),
    enabled: showNutrition,
  });

  const { data: reactionsSummary = [] } = useQuery({
    queryKey: ['reactionsSummary'],
    queryFn: () => sourcesApi.getFoodReactionsSummary(90, 10),
    enabled: showReactions,
  });

  // Group foods by date
  const foodsByDate = foodLogs.reduce((acc, food) => {
    const date = format(parseISO(food.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(food);
    return acc;
  }, {} as Record<string, FoodLog[]>);

  // Calculate today's totals
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysFoods = foodsByDate[today] || [];
  const todaysTotals = {
    calories: todaysFoods.reduce((sum, f) => sum + ((f.calories || 0) * (f.servings || 1)), 0),
    protein: todaysFoods.reduce((sum, f) => sum + ((f.protein_g || 0) * (f.servings || 1)), 0),
    carbs: todaysFoods.reduce((sum, f) => sum + ((f.carbs_g || 0) * (f.servings || 1)), 0),
    fat: todaysFoods.reduce((sum, f) => sum + ((f.fat_g || 0) * (f.servings || 1)), 0),
  };

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Food Tracking</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Track meals, nutrition, and identify food sensitivities
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Log Food
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-xl shadow-soft p-5 mb-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          Today's Nutrition
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">{todaysTotals.calories}</p>
            <p className="text-xs text-gray-500">Calories</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{todaysTotals.protein.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{todaysTotals.carbs.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{todaysTotals.fat.toFixed(1)}g</p>
            <p className="text-xs text-gray-500">Fat</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowNutrition(!showNutrition)}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
            showNutrition ? 'bg-primary-500 text-white' : 'bg-white shadow-soft hover:bg-gray-50'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Nutrition Trends
        </button>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
            showReactions ? 'bg-warning-500 text-white' : 'bg-white shadow-soft hover:bg-gray-50'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Food Reactions
        </button>
      </div>

      {/* Nutrition Trends Panel */}
      {showNutrition && nutritionSummary.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft p-5 mb-6">
          <h3 className="font-semibold mb-4">7-Day Nutrition Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Calories</th>
                  <th className="pb-2">Protein</th>
                  <th className="pb-2">Carbs</th>
                  <th className="pb-2">Fat</th>
                  <th className="pb-2">Meals</th>
                </tr>
              </thead>
              <tbody>
                {nutritionSummary.map((day) => (
                  <tr key={day.date} className="border-b border-gray-100">
                    <td className="py-2">{format(parseISO(day.date), 'EEE, MMM d')}</td>
                    <td className="py-2 font-medium">{day.total_calories}</td>
                    <td className="py-2">{day.total_protein_g}g</td>
                    <td className="py-2">{day.total_carbs_g}g</td>
                    <td className="py-2">{day.total_fat_g}g</td>
                    <td className="py-2">{day.meals_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Food Reactions Panel */}
      {showReactions && (
        <div className="bg-white rounded-xl shadow-soft p-5 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            Foods That Caused Reactions
          </h3>
          {reactionsSummary.length === 0 ? (
            <p className="text-gray-500 text-sm">No food reactions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {reactionsSummary.map((reaction) => (
                <div
                  key={reaction.food_name}
                  className="flex items-center justify-between p-3 bg-warning-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{reaction.food_name}</p>
                    <p className="text-sm text-gray-600">
                      {reaction.reaction_count} reaction(s), avg severity: {reaction.avg_severity.toFixed(1)}
                    </p>
                    {reaction.common_symptoms.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Symptoms: {reaction.common_symptoms.join(', ')}
                      </p>
                    )}
                  </div>
                  <span
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      reaction.avg_severity >= 4
                        ? 'bg-red-100 text-red-700'
                        : reaction.avg_severity >= 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {reaction.avg_severity >= 4 ? 'High Risk' : reaction.avg_severity >= 3 ? 'Moderate' : 'Low'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meal Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedMeal('all')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
            selectedMeal === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          )}
        >
          All Meals
        </button>
        {(['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'supplement'] as MealCategory[]).map(
          (meal) => {
            const Icon = MEAL_ICONS[meal];
            return (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors',
                  selectedMeal === meal ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {MEAL_LABELS[meal]}
              </button>
            );
          }
        )}
      </div>

      {/* Add Food Modal */}
      {showAddForm && <AddFoodModal onClose={() => setShowAddForm(false)} />}

      {/* Food Logs by Date */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : Object.keys(foodsByDate).length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No food entries yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-primary-500 font-semibold hover:underline"
          >
            Log your first meal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(foodsByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, foods]) => (
              <div key={date}>
                <h3 className="font-semibold text-gray-700 mb-3">
                  {date === today ? 'Today' : format(parseISO(date), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-3">
                  {foods.map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function FoodCard({ food }: { food: FoodLog }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const Icon = MEAL_ICONS[food.meal_category];

  const deleteMutation = useMutation({
    mutationFn: () => actionsApi.deleteFoodLog(food.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const totalCalories = (food.calories || 0) * (food.servings || 1);

  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                food.had_reaction ? 'bg-warning-100' : 'bg-primary-100'
              )}
            >
              <Icon className={clsx('w-5 h-5', food.had_reaction ? 'text-warning-500' : 'text-primary-500')} />
            </div>
            <div>
              <h3 className="font-semibold">{food.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{MEAL_LABELS[food.meal_category]}</span>
                <span>-</span>
                <span>{format(parseISO(food.timestamp), 'h:mm a')}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {food.calories && (
              <p className="font-semibold text-orange-600">{totalCalories} cal</p>
            )}
            {food.had_reaction && (
              <span className="px-2 py-0.5 bg-warning-100 text-warning-700 text-xs font-medium rounded">
                Reaction
              </span>
            )}
          </div>
        </div>

        {/* Quick Nutrition Info */}
        <div className="flex gap-4 mt-3 text-sm">
          {food.protein_g && (
            <span className="text-gray-600">
              <span className="font-medium">{(food.protein_g * (food.servings || 1)).toFixed(1)}g</span> protein
            </span>
          )}
          {food.carbs_g && (
            <span className="text-gray-600">
              <span className="font-medium">{(food.carbs_g * (food.servings || 1)).toFixed(1)}g</span> carbs
            </span>
          )}
          {food.fat_g && (
            <span className="text-gray-600">
              <span className="font-medium">{(food.fat_g * (food.servings || 1)).toFixed(1)}g</span> fat
            </span>
          )}
        </div>

        {/* Diet Tags */}
        {food.diet_tags && food.diet_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {food.diet_tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded"
              >
                {DIET_TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}

        {/* Allergen Warning */}
        {food.allergens && food.allergens.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Contains: {food.allergens.join(', ')}</span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {expanded ? 'Less' : 'More'} Details
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this food entry?')) {
                deleteMutation.mutate();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-danger-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {food.serving_size && (
              <div>
                <span className="text-gray-500">Serving Size:</span>
                <span className="ml-2 font-medium">{food.serving_size}</span>
              </div>
            )}
            {food.servings && (
              <div>
                <span className="text-gray-500">Servings:</span>
                <span className="ml-2 font-medium">{food.servings}</span>
              </div>
            )}
            {food.fiber_g && (
              <div>
                <span className="text-gray-500">Fiber:</span>
                <span className="ml-2 font-medium">{(food.fiber_g * (food.servings || 1)).toFixed(1)}g</span>
              </div>
            )}
            {food.sugar_g && (
              <div>
                <span className="text-gray-500">Sugar:</span>
                <span className="ml-2 font-medium">{(food.sugar_g * (food.servings || 1)).toFixed(1)}g</span>
              </div>
            )}
            {food.sodium_mg && (
              <div>
                <span className="text-gray-500">Sodium:</span>
                <span className="ml-2 font-medium">{(food.sodium_mg * (food.servings || 1)).toFixed(0)}mg</span>
              </div>
            )}
            {food.brand && (
              <div>
                <span className="text-gray-500">Brand:</span>
                <span className="ml-2 font-medium">{food.brand}</span>
              </div>
            )}
          </div>
          {food.notes && (
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Notes:</span>
              <p className="mt-1">{food.notes}</p>
            </div>
          )}
          {food.had_reaction && food.reaction_notes && (
            <div className="mt-3 p-2 bg-warning-50 rounded-lg text-sm">
              <span className="text-warning-700 font-medium">Reaction Notes:</span>
              <p className="text-warning-600 mt-1">{food.reaction_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddFoodModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [mealCategory, setMealCategory] = useState<MealCategory>('snack');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [servings, setServings] = useState('1');
  const [servingSize, setServingSize] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [hadReaction, setHadReaction] = useState(false);
  const [reactionSeverity, setReactionSeverity] = useState('');
  const [reactionNotes, setReactionNotes] = useState('');

  const { data: suggestions = [] } = useQuery({
    queryKey: ['foodSuggestions', name],
    queryFn: () => sourcesApi.getFoodSuggestions(name),
    enabled: name.length >= 2,
  });

  const { data: referenceFoods = [] } = useQuery({
    queryKey: ['referenceFoods', name],
    queryFn: () => sourcesApi.getReferenceFoods(name),
    enabled: name.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: actionsApi.logFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const handleSelectFood = (food: ReferenceFood) => {
    setName(food.name);
    if (food.calories) setCalories(food.calories.toString());
    if (food.protein_g) setProtein(food.protein_g.toString());
    if (food.carbs_g) setCarbs(food.carbs_g.toString());
    if (food.fat_g) setFat(food.fat_g.toString());
    if (food.serving_size) setServingSize(food.serving_size);
    if (food.diet_tags) setSelectedDietTags(food.diet_tags);
    if (food.allergens) setSelectedAllergens(food.allergens);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      name,
      meal_category: mealCategory,
      calories: calories ? parseInt(calories) : undefined,
      protein_g: protein ? parseFloat(protein) : undefined,
      carbs_g: carbs ? parseFloat(carbs) : undefined,
      fat_g: fat ? parseFloat(fat) : undefined,
      servings: servings ? parseFloat(servings) : 1,
      serving_size: servingSize || undefined,
      diet_tags: selectedDietTags,
      allergens: selectedAllergens,
      notes: notes || undefined,
      had_reaction: hadReaction,
      reaction_severity: hadReaction && reactionSeverity ? parseInt(reactionSeverity) : undefined,
      reaction_notes: hadReaction && reactionNotes ? reactionNotes : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-lg">Log Food</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Food Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Food Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="Search or enter food name..."
                required
              />
            </div>
            {showSuggestions && referenceFoods.length > 0 && name && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {referenceFoods.slice(0, 8).map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-gray-500">
                      {food.calories && `${food.calories} cal`}
                      {food.serving_size && ` - ${food.serving_size}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meal Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meal Category *
            </label>
            <select
              value={mealCategory}
              onChange={(e) => setMealCategory(e.target.value as MealCategory)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              required
            >
              {(['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'supplement'] as MealCategory[]).map(
                (meal) => (
                  <option key={meal} value={meal}>
                    {MEAL_LABELS[meal]}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Nutrition Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servings
              </label>
              <input
                type="number"
                step="0.5"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serving Size
              </label>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="e.g., 1 cup"
              />
            </div>
          </div>

          {/* Diet Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diet Compatibility
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DIET_TAG_LABELS).map(([tag, label]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedDietTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    selectedDietTags.includes(tag)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contains Allergens
            </label>
            <div className="flex flex-wrap gap-2">
              {['dairy', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'gluten', 'soy'].map(
                (allergen) => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() =>
                      setSelectedAllergens((prev) =>
                        prev.includes(allergen)
                          ? prev.filter((a) => a !== allergen)
                          : [...prev, allergen]
                      )
                    }
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-medium transition-colors',
                      selectedAllergens.includes(allergen)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {allergen.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Reaction Section */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hadReaction}
                onChange={(e) => setHadReaction(e.target.checked)}
                className="w-4 h-4 text-warning-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                I had a reaction to this food
              </span>
            </label>
            {hadReaction && (
              <div className="mt-3 space-y-3 p-3 bg-warning-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reaction Severity (1-5)
                  </label>
                  <select
                    value={reactionSeverity}
                    onChange={(e) => setReactionSeverity(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-warning-500 focus:outline-none"
                  >
                    <option value="">Select severity</option>
                    <option value="1">1 - Minimal</option>
                    <option value="2">2 - Mild</option>
                    <option value="3">3 - Moderate</option>
                    <option value="4">4 - Significant</option>
                    <option value="5">5 - Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reaction Notes
                  </label>
                  <textarea
                    value={reactionNotes}
                    onChange={(e) => setReactionNotes(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-warning-500 focus:outline-none"
                    rows={2}
                    placeholder="Describe your reaction..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              rows={2}
              placeholder="Any additional notes..."
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
              {addMutation.isPending ? 'Logging...' : 'Log Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
