import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Upload,
  Save,
  Scale,
  Ruler,
  Heart,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react';
import { ChildProfile, Interest } from '../types';
import { updateChild, deleteChild } from '../services/storageService';
import { AVAILABLE_INTERESTS, INTEREST_CATEGORIES, POPULAR_CHARACTERS, FAVORITE_COLORS } from '../data/interests';

interface EditProfileProps {
  child: ChildProfile;
  onSave: (updatedChild: ChildProfile) => void;
  onBack: () => void;
  onDelete?: () => void;
}

type EditTab = 'photo' | 'basics' | 'measurements' | 'interests' | 'favorites';

const EditProfile: React.FC<EditProfileProps> = ({ child, onSave, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<EditTab>('photo');
  const [formData, setFormData] = useState({
    name: child.name,
    nickname: child.nickname || '',
    weight: child.weight.toString(),
    height: child.height.toString(),
    headCircumference: child.headCircumference?.toString() || '',
    interests: [...child.interests],
    favoriteCharacters: [...child.favoriteCharacters],
    favoriteToys: [...child.favoriteToys],
    favoriteColors: [...child.favoriteColors],
    profilePhoto: child.profilePhoto || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedChild = updateChild(child.id, {
        name: formData.name,
        nickname: formData.nickname || undefined,
        weight: parseFloat(formData.weight) || child.weight,
        height: parseFloat(formData.height) || child.height,
        headCircumference: formData.headCircumference ? parseFloat(formData.headCircumference) : undefined,
        interests: formData.interests,
        favoriteCharacters: formData.favoriteCharacters,
        favoriteToys: formData.favoriteToys,
        favoriteColors: formData.favoriteColors,
        profilePhoto: formData.profilePhoto || undefined,
      });

      if (updatedChild) {
        onSave(updatedChild);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (deleteChild(child.id)) {
      onDelete?.();
    }
  };

  const tabs: { id: EditTab; label: string; icon: string }[] = [
    { id: 'photo', label: 'Photo', icon: '📷' },
    { id: 'basics', label: 'Basics', icon: '👶' },
    { id: 'measurements', label: 'Growth', icon: '📏' },
    { id: 'interests', label: 'Interests', icon: '❤️' },
    { id: 'favorites', label: 'Favorites', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-500">{child.name}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div
                  className="w-40 h-40 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl cursor-pointer"
                  onClick={() => document.getElementById('photo-edit')?.click()}
                >
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-16 h-16 text-emerald-400" />
                  )}
                </div>
                <button
                  className="absolute bottom-2 right-2 w-12 h-12 bg-emerald-500 rounded-full text-white flex items-center justify-center border-4 border-white shadow-lg hover:bg-emerald-600 transition-colors"
                  onClick={() => document.getElementById('photo-edit')?.click()}
                >
                  <Upload className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  id="photo-edit"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">Profile Photo</h3>
              <p className="text-sm text-gray-500 mb-4">
                This photo will be used to create personalized story illustrations
              </p>

              {formData.profilePhoto && (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, profilePhoto: '' }))}
                  className="text-red-500 text-sm font-medium hover:text-red-600"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Basics Tab */}
        {activeTab === 'basics' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Child's Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="What do you call them?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">
                <strong>Date of Birth:</strong> {new Date(child.dateOfBirth).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Age:</strong> {child.ageMonths} months
              </p>
            </div>
          </div>
        )}

        {/* Measurements Tab */}
        {activeTab === 'measurements' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Update Measurements</h3>
                <p className="text-sm text-gray-500">Track growth over time</p>
              </div>
            </div>

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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            {child.ageMonths < 24 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Head Circumference (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.headCircumference}
                  onChange={(e) => setFormData({ ...formData, headCircumference: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>
            )}
          </div>
        )}

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Interests</h3>
                <p className="text-sm text-gray-500">What does {child.name} love?</p>
              </div>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {INTEREST_CATEGORIES.map(category => (
                <div key={category.id}>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_INTERESTS
                      .filter(i => i.category === category.id)
                      .slice(0, 8)
                      .map(interest => (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                            formData.interests.find(i => i.id === interest.id)
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
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Favorites</h3>
                <p className="text-sm text-gray-500">For personalized stories</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Favorite Characters</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {POPULAR_CHARACTERS.map(character => (
                  <button
                    key={character}
                    type="button"
                    onClick={() => toggleCharacter(character)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.favoriteCharacters.includes(character)
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
              <h4 className="font-medium text-gray-700 mb-3">Favorite Colors</h4>
              <div className="flex flex-wrap gap-3">
                {FAVORITE_COLORS.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color.name)}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      formData.favoriteColors.includes(color.name)
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
              <h4 className="font-medium text-gray-700 mb-3">Favorite Toys</h4>
              <input
                type="text"
                placeholder="Press Enter to add..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !formData.favoriteToys.includes(value)) {
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
                <div className="flex flex-wrap gap-2 mt-3">
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
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Profile Section */}
        <div className="mt-8 p-4 bg-red-50 rounded-2xl">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-red-600 font-medium py-2 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete Profile
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 text-center">
                Are you sure? This will delete all of {child.name}'s data including analyses and stories.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white text-gray-600 rounded-xl font-medium border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
