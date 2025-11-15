import { useState, useEffect } from 'react';
import { useUserProfile, useCreateProfile, useUpdateProfile } from '@/hooks/meal-tracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProfileFormData, Gender, ActivityLevel, Goal } from '@/types/meal-tracker';

interface ProfileFormProps {
  onSuccess?: () => void;
  embedded?: boolean;
}

export function ProfileForm({ onSuccess, embedded = false }: ProfileFormProps) {
  const { data: profile, isLoading } = useUserProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();

  const isEditing = !!profile;
  const [formData, setFormData] = useState<ProfileFormData>({
    age: profile?.age || 25,
    weightKg: profile?.weightKg || 70,
    heightCm: profile?.heightCm || 170,
    gender: profile?.gender || 'male',
    activityLevel: profile?.activityLevel || 'moderately_active',
    goal: profile?.goal || 'maintain_weight',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateProfile.mutateAsync(formData);
        toast.success('Profile updated successfully!');
      } else {
        await createProfile.mutateAsync(formData);
        toast.success('Profile created successfully!');
      }
      onSuccess?.();
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

  const FormWrapper = embedded ? 'div' : Card;
  const HeaderWrapper = embedded ? 'div' : CardHeader;
  const ContentWrapper = embedded ? 'div' : CardContent;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormWrapper>
        {!embedded && (
          <HeaderWrapper>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Tell us about yourself to calculate your daily calorie needs
            </CardDescription>
          </HeaderWrapper>
        )}
        {embedded && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground">
              Tell us about yourself to calculate your daily calorie needs
            </p>
          </div>
        )}
        <ContentWrapper className="space-y-4">
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
                value={formData.weightKg}
                onChange={(e) => handleChange('weightKg', parseFloat(e.target.value))}
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
                value={formData.heightCm}
                onChange={(e) => handleChange('heightCm', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>
        </ContentWrapper>
      </FormWrapper>

      <FormWrapper>
        {!embedded && (
          <HeaderWrapper>
            <CardTitle>Activity Level</CardTitle>
            <CardDescription>
              How active are you on a typical day?
            </CardDescription>
          </HeaderWrapper>
        )}
        {embedded && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Activity Level</h3>
            <p className="text-sm text-muted-foreground">
              How active are you on a typical day?
            </p>
          </div>
        )}
        <ContentWrapper className="space-y-3">
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
                formData.activityLevel === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <input
                type="radio"
                name="activityLevel"
                value={option.value}
                checked={formData.activityLevel === option.value}
                onChange={(e) => handleChange('activityLevel', e.target.value as ActivityLevel)}
                className="h-4 w-4 text-primary"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </ContentWrapper>
      </FormWrapper>

      <FormWrapper>
        {!embedded && (
          <HeaderWrapper>
            <CardTitle>Your Goal</CardTitle>
            <CardDescription>
              What do you want to achieve?
            </CardDescription>
          </HeaderWrapper>
        )}
        {embedded && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Your Goal</h3>
            <p className="text-sm text-muted-foreground">
              What do you want to achieve?
            </p>
          </div>
        )}
        <ContentWrapper className="space-y-3">
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
        </ContentWrapper>
      </FormWrapper>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
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
