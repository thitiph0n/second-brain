import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUserProfile, useCreateProfile, useUpdateProfile } from '@/hooks/meal-tracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { ProfileFormData, Gender, ActivityLevel, Goal } from '@/types/meal-tracker';

export function ProfileForm() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useUserProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();

  // Debug logging
  console.log('ProfileForm render - isLoading:', isLoading, 'profile:', profile);

  const isEditing = !!profile;
  const [formData, setFormData] = useState<ProfileFormData>({
    age: profile?.age || 25,
    weight_kg: profile?.weight_kg || 70,
    height_cm: profile?.height_cm || 170,
    gender: profile?.gender || 'male',
    activity_level: profile?.activity_level || 'moderately_active',
    goal: profile?.goal || 'maintain_weight',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateProfile.mutateAsync(formData);
      } else {
        await createProfile.mutateAsync(formData);
      }
      navigate({ to: '/meal-tracker' });
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const isSubmitting = createProfile.isPending || updateProfile.isPending;

  const handleChange = (field: keyof ProfileFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Tell us about yourself to calculate your daily calorie needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                min="10"
                max="120"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value as Gender)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="250"
                step="0.1"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Level</CardTitle>
          <CardDescription>
            How active are you on a typical day?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
            { value: 'lightly_active', label: 'Lightly Active', description: 'Exercise 1-3 days/week' },
            { value: 'moderately_active', label: 'Moderately Active', description: 'Exercise 3-5 days/week' },
            { value: 'very_active', label: 'Very Active', description: 'Exercise 6-7 days/week' },
            { value: 'extremely_active', label: 'Extremely Active', description: 'Very intense exercise daily' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.activity_level === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <input
                type="radio"
                name="activity_level"
                value={option.value}
                checked={formData.activity_level === option.value}
                onChange={(e) => handleChange('activity_level', e.target.value as ActivityLevel)}
                className="h-4 w-4 text-primary"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Goal</CardTitle>
          <CardDescription>
            What do you want to achieve?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: 'lose_weight', label: 'Lose Weight', description: '-500 cal/day (approx 0.5 kg/week)' },
            { value: 'maintain_weight', label: 'Maintain Weight', description: 'Stay at current weight' },
            { value: 'gain_weight', label: 'Gain Weight', description: '+500 cal/day (approx 0.5 kg/week)' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.goal === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <input
                type="radio"
                name="goal"
                value={option.value}
                checked={formData.goal === option.value}
                onChange={(e) => handleChange('goal', e.target.value as Goal)}
                className="h-4 w-4 text-primary"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? 'Updating...' : 'Creating...'}
          </>
        ) : profile ? (
          'Update Profile'
        ) : (
          'Calculate My Targets'
        )}
      </Button>
    </form>
  );
}
