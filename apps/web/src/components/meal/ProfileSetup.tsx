import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Settings, ChevronDown, Activity, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { 
  UserProfile, 
  CreateUserProfileRequest, 
  UpdateUserProfileRequest,
  ProfileTracking,
  CreateProfileTrackingRequest,
  Gender,
  ActivityLevel 
} from '@/types/meal';

interface ProfileSetupProps {
  profile: UserProfile | null;
  latestTracking: ProfileTracking | null;
  onCreateProfile: (data: CreateUserProfileRequest) => Promise<void>;
  onUpdateProfile: (data: UpdateUserProfileRequest) => Promise<void>;
  onAddTracking: (data: CreateProfileTrackingRequest) => Promise<void>;
  isSubmitting?: boolean;
}

interface ProfileFormData {
  height_cm: string;
  age: string;
  gender: Gender;
  activity_level: ActivityLevel;
}

interface TrackingFormData {
  weight_kg: string;
  muscle_mass_kg: string;
  body_fat_percentage: string;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Very heavy exercise, physical job' },
];

export function ProfileSetup({ 
  profile, 
  latestTracking, 
  onCreateProfile, 
  onUpdateProfile, 
  onAddTracking,
  isSubmitting = false 
}: ProfileSetupProps) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    height_cm: '',
    age: '',
    gender: 'male',
    activity_level: 'moderate',
  });
  const [trackingForm, setTrackingForm] = useState<TrackingFormData>({
    weight_kg: '',
    muscle_mass_kg: '',
    body_fat_percentage: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize profile form when profile changes
  useEffect(() => {
    if (profile && showProfileDialog) {
      setProfileForm({
        height_cm: profile.height_cm.toString(),
        age: profile.age.toString(),
        gender: profile.gender,
        activity_level: profile.activity_level,
      });
    }
  }, [profile, showProfileDialog]);

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (height: number, weight: number, age: number, gender: Gender): number => {
    const baseMetabolism = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseMetabolism + 5 : baseMetabolism - 161;
  };

  // Calculate TDEE using activity level multiplier
  const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    return Math.round(bmr * multipliers[activityLevel]);
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const height = parseFloat(profileForm.height_cm);
    if (!profileForm.height_cm || isNaN(height) || height < 100 || height > 250) {
      newErrors.height_cm = 'Height must be between 100-250 cm';
    }

    const age = parseFloat(profileForm.age);
    if (!profileForm.age || isNaN(age) || age < 13 || age > 120) {
      newErrors.age = 'Age must be between 13-120 years';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTrackingForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (trackingForm.weight_kg) {
      const weight = parseFloat(trackingForm.weight_kg);
      if (isNaN(weight) || weight < 30 || weight > 300) {
        newErrors.weight_kg = 'Weight must be between 30-300 kg';
      }
    }

    if (trackingForm.muscle_mass_kg) {
      const muscle = parseFloat(trackingForm.muscle_mass_kg);
      if (isNaN(muscle) || muscle < 10 || muscle > 100) {
        newErrors.muscle_mass_kg = 'Muscle mass must be between 10-100 kg';
      }
    }

    if (trackingForm.body_fat_percentage) {
      const bodyFat = parseFloat(trackingForm.body_fat_percentage);
      if (isNaN(bodyFat) || bodyFat < 3 || bodyFat > 50) {
        newErrors.body_fat_percentage = 'Body fat must be between 3-50%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    const data = {
      height_cm: parseInt(profileForm.height_cm),
      age: parseInt(profileForm.age),
      gender: profileForm.gender,
      activity_level: profileForm.activity_level,
    };

    try {
      if (profile) {
        await onUpdateProfile(data);
        toast.success('Profile updated successfully!');
      } else {
        await onCreateProfile(data);
        toast.success('Profile created successfully!');
      }
      setShowProfileDialog(false);
    } catch (error) {
      // Error handling is done by parent component
      throw error;
    }
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTrackingForm()) {
      return;
    }

    // At least one field must be filled
    if (!trackingForm.weight_kg && !trackingForm.muscle_mass_kg && !trackingForm.body_fat_percentage) {
      toast.error('Please enter at least one measurement');
      return;
    }

    const data: CreateProfileTrackingRequest = {
      ...(trackingForm.weight_kg && { weight_kg: parseFloat(trackingForm.weight_kg) }),
      ...(trackingForm.muscle_mass_kg && { muscle_mass_kg: parseFloat(trackingForm.muscle_mass_kg) }),
      ...(trackingForm.body_fat_percentage && { body_fat_percentage: parseFloat(trackingForm.body_fat_percentage) }),
    };

    // Calculate BMR/TDEE if we have weight and profile data
    if (data.weight_kg && profile) {
      const bmr = calculateBMR(profile.height_cm, data.weight_kg, profile.age, profile.gender);
      const tdee = calculateTDEE(bmr, profile.activity_level);
      data.bmr_calories = Math.round(bmr);
      data.tdee_calories = tdee;
    }

    try {
      await onAddTracking(data);
      toast.success('Body measurements recorded successfully!');
      setShowTrackingDialog(false);
      setTrackingForm({ weight_kg: '', muscle_mass_kg: '', body_fat_percentage: '' });
    } catch (error) {
      // Error handling is done by parent component
      throw error;
    }
  };

  const selectedGender = GENDER_OPTIONS.find(g => g.value === profileForm.gender);
  const selectedActivityLevel = ACTIVITY_LEVELS.find(a => a.value === profileForm.activity_level);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Body Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <div className="text-center py-6">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Set up your profile to get personalized nutrition targets and BMR/TDEE calculations
              </p>
              <Button onClick={() => setShowProfileDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-semibold">{profile.height_cm} cm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-semibold">{profile.age} years</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-semibold capitalize">{profile.gender}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-semibold capitalize">{profile.activity_level.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Latest Tracking */}
              {latestTracking && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  {latestTracking.weight_kg && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-semibold">{latestTracking.weight_kg} kg</p>
                    </div>
                  )}
                  {latestTracking.body_fat_percentage && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Body Fat</p>
                      <p className="font-semibold">{latestTracking.body_fat_percentage}%</p>
                    </div>
                  )}
                  {latestTracking.bmr_calories && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">BMR</p>
                      <p className="font-semibold">{latestTracking.bmr_calories} cal</p>
                    </div>
                  )}
                  {latestTracking.tdee_calories && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">TDEE</p>
                      <p className="font-semibold">{latestTracking.tdee_calories} cal</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowProfileDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={() => setShowTrackingDialog(true)}>
                  <Activity className="h-4 w-4 mr-2" />
                  Record Measurements
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {profile ? 'Edit Profile' : 'Create Profile'}
            </DialogTitle>
            <DialogDescription>
              Enter your basic information for personalized nutrition calculations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={profileForm.height_cm}
                onChange={(e) => setProfileForm(prev => ({ ...prev, height_cm: e.target.value }))}
                disabled={isSubmitting}
                min="100"
                max="250"
                className={errors.height_cm ? 'border-red-500' : ''}
              />
              {errors.height_cm && (
                <p className="text-sm text-red-500">{errors.height_cm}</p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={profileForm.age}
                onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                disabled={isSubmitting}
                min="13"
                max="120"
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" disabled={isSubmitting}>
                    <span>{selectedGender?.label}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {GENDER_OPTIONS.map((gender) => (
                    <DropdownMenuItem 
                      key={gender.value} 
                      onClick={() => setProfileForm(prev => ({ ...prev, gender: gender.value }))}
                    >
                      {gender.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label>Activity Level *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" disabled={isSubmitting}>
                    <span>{selectedActivityLevel?.label}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {ACTIVITY_LEVELS.map((level) => (
                    <DropdownMenuItem 
                      key={level.value} 
                      onClick={() => setProfileForm(prev => ({ ...prev, activity_level: level.value }))}
                      className="flex-col items-start"
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleProfileSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Body Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Record Measurements
            </DialogTitle>
            <DialogDescription>
              Track your body composition and progress. All fields are optional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrackingSubmit} className="space-y-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70.5"
                value={trackingForm.weight_kg}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, weight_kg: e.target.value }))}
                disabled={isSubmitting}
                min="30"
                max="300"
                step="0.1"
                className={errors.weight_kg ? 'border-red-500' : ''}
              />
              {errors.weight_kg && (
                <p className="text-sm text-red-500">{errors.weight_kg}</p>
              )}
            </div>

            {/* Muscle Mass */}
            <div className="space-y-2">
              <Label htmlFor="muscle">Muscle Mass (kg)</Label>
              <Input
                id="muscle"
                type="number"
                placeholder="35.0"
                value={trackingForm.muscle_mass_kg}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, muscle_mass_kg: e.target.value }))}
                disabled={isSubmitting}
                min="10"
                max="100"
                step="0.1"
                className={errors.muscle_mass_kg ? 'border-red-500' : ''}
              />
              {errors.muscle_mass_kg && (
                <p className="text-sm text-red-500">{errors.muscle_mass_kg}</p>
              )}
            </div>

            {/* Body Fat */}
            <div className="space-y-2">
              <Label htmlFor="bodyFat">Body Fat (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                placeholder="15.5"
                value={trackingForm.body_fat_percentage}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, body_fat_percentage: e.target.value }))}
                disabled={isSubmitting}
                min="3"
                max="50"
                step="0.1"
                className={errors.body_fat_percentage ? 'border-red-500' : ''}
              />
              {errors.body_fat_percentage && (
                <p className="text-sm text-red-500">{errors.body_fat_percentage}</p>
              )}
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowTrackingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrackingSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Measurements'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}