import React, { useState } from 'react';
import {
  Baby,
  User,
  Calendar,
  Scale,
  Ruler,
  Globe,
  Heart,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Camera,
  Upload,
} from 'lucide-react';
import { ChildProfile, Interest, Region } from '../types';
import { REGIONS } from '../services/whoDataService';
import { AVAILABLE_INTERESTS, INTEREST_CATEGORIES, POPULAR_CHARACTERS, FAVORITE_COLORS } from '../data/interests';
import { saveChild, getChildren } from '../services/storageService';

interface ProfileSetupProps {
  onComplete: (child: ChildProfile) => void;
  onBack?: () => void;
}

type SetupStep = 'basics' | 'measurements' | 'region' | 'interests' | 'favorites';

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<SetupStep>('basics');
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    weight: '',
    height: '',
    headCircumference: '',
    regionCode: '',
    interests: [] as Interest[],
    favoriteCharacters: [] as string[],
    favoriteToys: [] as string[],
    favoriteColors: [] as string[],
    profilePhoto: '',
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };


  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());
    return Math.max(0, months);
  };

  const ageMonths = calculateAge(formData.dateOfBirth);
  const showHeadCircumference = ageMonths < 24;

  const selectedRegion = REGIONS.find(r => r.code === formData.regionCode);

  const toggleInterest = (interest: Interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.find(i => i.id === interest.id)
        ? prev.interests.filter(i => i.id !== interest.id)
        : [...prev.interests, interest]
    }));
  };

  const toggleCharacter = (character: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteCharacters: prev.favoriteCharacters.includes(character)
        ? prev.favoriteCharacters.filter(c => c !== character)
        : [...prev.favoriteCharacters, character]
    }));
  };

  const toggleColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteColors: prev.favoriteColors.includes(color)
        ? prev.favoriteColors.filter(c => c !== color)
        : [...prev.favoriteColors, color]
    }));
  };

  const handleSubmit = () => {
    if (!selectedRegion) return;

    const child = saveChild({
      name: formData.name,
      nickname: formData.nickname || undefined,
      dateOfBirth: formData.dateOfBirth,
      ageMonths,
      gender: formData.gender as 'male' | 'female' | 'other',
      weight: parseFloat(formData.weight) || 0,
      height: parseFloat(formData.height) || 0,
      headCircumference: formData.headCircumference ? parseFloat(formData.headCircumference) : undefined,
      region: selectedRegion,
      interests: formData.interests,
      favoriteCharacters: formData.favoriteCharacters,
      favoriteToys: formData.favoriteToys,
      favoriteColors: formData.favoriteColors,
      profilePhoto: formData.profilePhoto || undefined,
    });

    onComplete(child);
  };

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return formData.name && formData.dateOfBirth && formData.gender;
      case 'measurements':
        return formData.weight && formData.height;
      case 'region':
        return formData.regionCode;
      case 'interests':
        return true; // Optional
      case 'favorites':
        return true; // Optional
      default:
        return false;
    }
  };

  const steps: SetupStep[] = ['basics', 'measurements', 'region', 'interests', 'favorites'];
  const currentStepIndex = steps.indexOf(step);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < currentStepIndex
                  ? 'bg-emerald-500 text-white'
                  : i === currentStepIndex
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-200'
                    : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {i < currentStepIndex ? <Check className="w-5 h-5" /> : i + 1}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step: Basics */}
        {step === 'basics' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div
                  className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-lg cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-10 h-10 text-emerald-600" />
                  )}
                </div>
                <button
                  className="absolute bottom-4 right-0 w-8 h-8 bg-emerald-500 rounded-full text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-emerald-600 transition-colors"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Tell us about your little one</h2>
              <p className="text-gray-500 mt-2">Let's get to know your child better</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nickname (optional)
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="What do you call them?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
                {ageMonths > 0 && (
                  <p className="text-sm text-emerald-600 mt-2 font-medium">
                    {ageMonths} months old
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'male', label: 'Boy', icon: '👦' },
                    { value: 'female', label: 'Girl', icon: '👧' },
                    { value: 'other', label: 'Other', icon: '👶' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option.value as any })}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.gender === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 hover:border-emerald-200'
                        }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Measurements */}
        {step === 'measurements' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Growth Measurements</h2>
              <p className="text-gray-500 mt-2">This helps us track development against WHO standards</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 10.5"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g., 75"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>

              {showHeadCircumference && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Head Circumference (cm) - for babies under 2
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.headCircumference}
                    onChange={(e) => setFormData({ ...formData, headCircumference: e.target.value })}
                    placeholder="e.g., 45"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                <strong>Why we ask:</strong> These measurements help us compare your child's growth
                against WHO international growth standards and provide personalized insights.
              </div>
            </div>
          </div>
        )}

        {/* Step: Region */}
        {step === 'region' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Your Region</h2>
              <p className="text-gray-500 mt-2">We'll provide region-specific health resources</p>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {REGIONS.map(region => (
                <button
                  key={region.code}
                  type="button"
                  onClick={() => setFormData({ ...formData, regionCode: region.code })}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${formData.regionCode === region.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-100 hover:border-emerald-200'
                    }`}
                >
                  <span className="text-2xl">
                    {region.code === 'US' ? '🇺🇸' :
                      region.code === 'GB' ? '🇬🇧' :
                        region.code === 'IN' ? '🇮🇳' :
                          region.code === 'CN' ? '🇨🇳' :
                            region.code === 'JP' ? '🇯🇵' :
                              region.code === 'AU' ? '🇦🇺' :
                                region.code === 'DE' ? '🇩🇪' :
                                  region.code === 'FR' ? '🇫🇷' :
                                    region.code === 'CA' ? '🇨🇦' :
                                      region.code === 'BR' ? '🇧🇷' : '🌍'}
                  </span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{region.name}</div>
                    <div className="text-xs text-gray-500">WHO Region: {region.whoRegion}</div>
                  </div>
                  {formData.regionCode === region.code && (
                    <Check className="w-5 h-5 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Interests */}
        {step === 'interests' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What does {formData.name || 'your child'} love?</h2>
              <p className="text-gray-500 mt-2">Select interests to personalize the experience</p>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {INTEREST_CATEGORIES.map(category => (
                <div key={category.id}>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_INTERESTS
                      .filter(i => i.category === category.id)
                      .slice(0, 8)
                      .map(interest => (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${formData.interests.find(i => i.id === interest.id)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                            }`}
                        >
                          <span>{interest.icon}</span>
                          <span>{interest.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {formData.interests.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700">
                  Selected: {formData.interests.map(i => i.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Favorites */}
        {step === 'favorites' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Favorite Things</h2>
              <p className="text-gray-500 mt-2">We'll use these to create personalized stories!</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Favorite Characters</h3>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {POPULAR_CHARACTERS.map(character => (
                    <button
                      key={character}
                      type="button"
                      onClick={() => toggleCharacter(character)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${formData.favoriteCharacters.includes(character)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                      {character}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Favorite Colors</h3>
                <div className="flex flex-wrap gap-3">
                  {FAVORITE_COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => toggleColor(color.name)}
                      className={`w-12 h-12 rounded-xl transition-all ${formData.favoriteColors.includes(color.name)
                        ? 'ring-4 ring-emerald-500 ring-offset-2'
                        : ''
                        }`}
                      style={{ background: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Favorite Toys (type to add)</h3>
                <input
                  type="text"
                  placeholder="e.g., teddy bear, blocks..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        setFormData(prev => ({
                          ...prev,
                          favoriteToys: [...prev.favoriteToys, value]
                        }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
                {formData.favoriteToys.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.favoriteToys.map((toy, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {toy}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            favoriteToys: prev.favoriteToys.filter((_, idx) => idx !== i)
                          }))}
                          className="ml-1 hover:text-red-500"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          {(currentStepIndex > 0 || (onBack && getChildren().length > 0)) && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${canProceed()
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {currentStepIndex === steps.length - 1 ? 'Complete' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
