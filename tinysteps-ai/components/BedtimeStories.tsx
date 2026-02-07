import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Moon,
  Star,
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Heart,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { ChildProfile, BedtimeStory } from '../types';
import { getStories, saveStory, updateStory } from '../services/storageService';
import { generateBedtimeStory, generateStoryIllustration } from '../services/geminiService';

interface BedtimeStoriesProps {
  child: ChildProfile;
  onBack: () => void;
}

const BedtimeStories: React.FC<BedtimeStoriesProps> = ({ child, onBack }) => {
  const [stories, setStories] = useState<BedtimeStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<BedtimeStory | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [generatingIllustration, setGeneratingIllustration] = useState<number | null>(null);
  const [illustrationCache, setIllustrationCache] = useState<Record<string, string>>({});

  useEffect(() => {
    setStories(getStories(child.id));
  }, [child.id]);

  const storyThemes = [
    { id: 'adventure', name: 'Adventure', icon: '🌟', color: 'from-amber-400 to-orange-500' },
    { id: 'animals', name: 'Animals', icon: '🐻', color: 'from-emerald-400 to-teal-500' },
    { id: 'space', name: 'Space', icon: '🚀', color: 'from-indigo-400 to-purple-500' },
    { id: 'ocean', name: 'Ocean', icon: '🐠', color: 'from-blue-400 to-cyan-500' },
    { id: 'fairy', name: 'Fairy Tale', icon: '🧚', color: 'from-pink-400 to-rose-500' },
    { id: 'dinosaurs', name: 'Dinosaurs', icon: '🦕', color: 'from-green-400 to-emerald-500' },
  ];

  // Add themes based on child's interests
  const personalizedThemes = child.interests.slice(0, 3).map(interest => ({
    id: interest.id,
    name: interest.name,
    icon: interest.icon,
    color: 'from-violet-400 to-purple-500',
    personalized: true,
  }));

  const allThemes = [...personalizedThemes, ...storyThemes.filter(t =>
    !personalizedThemes.find(p => p.id === t.id)
  )];

  const handleGenerateStory = async (theme: string) => {
    setIsGenerating(true);
    setSelectedTheme(theme);

    try {
      const storyData = await generateBedtimeStory(child, theme);
      const newStory = saveStory(storyData);
      setStories([newStory, ...stories]);
      setSelectedStory(newStory);
      setCurrentPage(0);
    } catch (error) {
      console.error('Failed to generate story:', error);
      alert('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      if (isReading) {
        setIsReading(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsReading(false);

      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  // Generate illustration for current page
  const generateIllustrationForPage = useCallback(async (pageIndex: number) => {
    if (!selectedStory || !child.profilePhoto) return;

    const cacheKey = `${selectedStory.id}-${pageIndex}`;

    // Check if already cached or already has imageUrl
    if (illustrationCache[cacheKey] || selectedStory.illustrations[pageIndex]?.imageUrl) {
      return;
    }

    const illustration = selectedStory.illustrations[pageIndex];
    if (!illustration?.description) return;

    setGeneratingIllustration(pageIndex);

    try {
      const imageUrl = await generateStoryIllustration(
        child.profilePhoto,
        illustration.description,
        child.name,
        illustration.style || 'storybook'
      );

      if (imageUrl) {
        // Cache the illustration
        setIllustrationCache(prev => ({
          ...prev,
          [cacheKey]: imageUrl
        }));

        // Update the story with the new illustration
        const updatedIllustrations = [...selectedStory.illustrations];
        updatedIllustrations[pageIndex] = {
          ...updatedIllustrations[pageIndex],
          imageUrl
        };

        const updatedStory = {
          ...selectedStory,
          illustrations: updatedIllustrations
        };

        // Update in storage and state
        updateStory(updatedStory);
        setSelectedStory(updatedStory);
        setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
      }
    } catch (error) {
      console.error('Failed to generate illustration:', error);
    } finally {
      setGeneratingIllustration(null);
    }
  }, [selectedStory, child.profilePhoto, child.name, illustrationCache]);

  // Auto-generate illustration when page changes
  useEffect(() => {
    if (selectedStory && child.profilePhoto) {
      generateIllustrationForPage(currentPage);
    }
  }, [currentPage, selectedStory?.id]);

  const StoryReader = () => {
    if (!selectedStory) return null;

    const content = selectedStory.content;
    const totalPages = content.length;
    const currentContent = content[currentPage];

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsReading(false);
                setSelectedStory(null);
              }}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-white font-bold">{selectedStory.title}</h1>
              <p className="text-purple-200 text-sm">{selectedStory.duration} min read</p>
            </div>
            <button
              onClick={() => speakText(currentContent)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isReading ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              {isReading ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div className="px-6 pb-32">
          {/* Illustration */}
          {(() => {
            const illustration = selectedStory.illustrations[currentPage];
            const cacheKey = `${selectedStory.id}-${currentPage}`;
            const cachedImage = illustrationCache[cacheKey] || illustration?.imageUrl;
            const isGeneratingThis = generatingIllustration === currentPage;

            if (cachedImage) {
              // Show generated illustration
              return (
                <div className="aspect-video rounded-3xl mb-6 overflow-hidden border border-white/10 shadow-xl">
                  <img
                    src={cachedImage}
                    alt={illustration?.description || 'Story illustration'}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            }

            if (isGeneratingThis) {
              // Show loading state
              return (
                <div className="aspect-video bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl mb-6 flex items-center justify-center border border-white/10">
                  <div className="text-center text-white/80">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-purple-300" />
                    <p className="text-sm font-medium">Creating illustration...</p>
                    <p className="text-xs text-white/60 mt-1">Bringing the scene to life</p>
                  </div>
                </div>
              );
            }

            // Show placeholder with generate button
            return (
              <div className="aspect-video bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl mb-6 flex items-center justify-center border border-white/10">
                <div className="text-center text-white/60">
                  {child.profilePhoto ? (
                    <button
                      onClick={() => generateIllustrationForPage(currentPage)}
                      className="flex flex-col items-center hover:text-white/80 transition-colors"
                    >
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Tap to generate illustration</p>
                      <p className="text-xs mt-1 max-w-[200px]">{illustration?.description || 'Imagine the scene...'}</p>
                    </button>
                  ) : (
                    <>
                      <Sparkles className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">{illustration?.description || 'Imagine the scene...'}</p>
                      <p className="text-xs mt-2 text-amber-300">Add a profile photo to generate illustrations</p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Story Text */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-h-[200px]">
            <p className="text-white text-lg leading-relaxed font-serif">
              {currentContent}
            </p>
          </div>

          {/* Moral (on last page) */}
          {currentPage === totalPages - 1 && selectedStory.moral && (
            <div className="mt-4 bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
              <p className="text-amber-200 text-sm flex items-start gap-2">
                <Star className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>Moral:</strong> {selectedStory.moral}</span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent px-6 py-8">
          {/* Progress */}
          <div className="flex gap-1 justify-center mb-4">
            {content.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-1 rounded-full transition-all ${i === currentPage ? 'w-8 bg-white' : 'w-2 bg-white/30'
                  }`}
              />
            ))}
          </div>

          {/* Page Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${currentPage === 0
                  ? 'text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <span className="text-white/60 text-sm">
              {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${currentPage === totalPages - 1
                  ? 'text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedStory) {
    return <StoryReader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Bedtime Stories</h1>
            <div className="flex items-center gap-2 mt-1">
              {child.profilePhoto && (
                <img
                  src={child.profilePhoto}
                  alt={child.name}
                  className="w-6 h-6 rounded-full object-cover border border-white/30"
                />
              )}
              <p className="text-purple-200 text-sm">Starring {child.name}!</p>
            </div>
          </div>
          <Moon className="w-8 h-8 text-amber-300" />
        </div>

        {/* Decorative Stars */}
        <div className="flex justify-around">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 text-yellow-300 animate-pulse`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <div className="px-6 pb-24 space-y-8">
        {/* Create New Story */}
        <div>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            Create a New Story
          </h2>

          {isGenerating ? (
            <div className="bg-white/10 rounded-2xl p-8 text-center">
              <Loader2 className="w-12 h-12 text-purple-300 mx-auto mb-4 animate-spin" />
              <p className="text-white font-medium">Creating a magical story...</p>
              <p className="text-purple-200 text-sm mt-2">
                Writing an adventure about {selectedTheme} for {child.name}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {allThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleGenerateStory(theme.name)}
                  className={`p-4 rounded-xl bg-gradient-to-br ${theme.color} text-white text-left transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className="text-3xl block mb-2">{theme.icon}</span>
                  <span className="font-medium block">{theme.name}</span>
                  {(theme as any).personalized && (
                    <span className="text-xs opacity-75 flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3" /> {child.name}'s favorite
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Story Library */}
        {stories.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-300" />
              Story Library
            </h2>

            <div className="space-y-3">
              {stories.map(story => (
                <button
                  key={story.id}
                  onClick={() => {
                    setSelectedStory(story);
                    setCurrentPage(0);
                  }}
                  className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{story.title}</h3>
                      <p className="text-purple-200 text-sm mt-1">{story.theme}</p>
                      <div className="flex items-center gap-3 mt-2 text-purple-300 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {story.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {story.content.length} pages
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stories.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Moon className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
            <p className="text-purple-200">No stories yet</p>
            <p className="text-purple-300/60 text-sm mt-1">
              Choose a theme above to create {child.name}'s first bedtime story
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BedtimeStories;
