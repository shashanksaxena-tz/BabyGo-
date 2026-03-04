import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Clock,
  Heart,
  Loader2,
  Image as ImageIcon,
  Wand2,
  Download,
} from 'lucide-react';
import { ChildProfile, BedtimeStory } from '../types';
import { getStories, saveStory, updateStory, fetchStories } from '../services/storageService';
import apiService, { dataUrlToFile } from '../services/apiService';
import LanguagePicker from './LanguagePicker';
import CustomStoryBuilder from './CustomStoryBuilder';

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
  const generatingPagesRef = useRef<Set<string>>(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [translatedPages, setTranslatedPages] = useState<string[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  useEffect(() => {
    // Load from localStorage immediately
    setStories(getStories(child.id));

    // Then fetch from API
    fetchStories(child.id).then((apiStories) => {
      setStories(apiStories);
    }).catch(() => {});
  }, [child.id]);

  useEffect(() => {
    if (!selectedStory || selectedLanguage === 'en-IN') {
      setTranslatedPages(null);
      return;
    }
    let cancelled = false;
    const translate = async () => {
      setIsTranslating(true);
      setTranslatedPages(null);
      const translated = await Promise.all(
        selectedStory.content.map(async (pageText) => {
          const result = await apiService.translateText(pageText, selectedLanguage);
          return result.translatedText || pageText;
        })
      );
      if (!cancelled) {
        setTranslatedPages(translated);
        setIsTranslating(false);
      }
    };
    translate();
    return () => { cancelled = true; };
  }, [selectedStory?.id, selectedLanguage]);

  const storyThemes = [
    { id: 'adventure', name: 'Adventure', icon: '🌟', color: 'from-amber-400 to-orange-500' },
    { id: 'animals', name: 'Animals', icon: '🐻', color: 'from-emerald-400 to-teal-500' },
    { id: 'space', name: 'Space', icon: '🚀', color: 'from-indigo-400 to-purple-500' },
    { id: 'ocean', name: 'Ocean', icon: '🐠', color: 'from-blue-400 to-cyan-500' },
    { id: 'magic', name: 'Fairy Tale', icon: '🧚', color: 'from-pink-400 to-rose-500' },
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
      const result = await apiService.generateStory(child.id, theme);
      const data = (result as any).data;
      if (!data?.story) {
        throw new Error((result as any).error || 'Story generation failed');
      }
      const s = data.story;
      const newStory: BedtimeStory = {
        id: s._id || s.id,
        childId: s.childId,
        title: s.title,
        theme: typeof s.theme === 'object' ? s.theme.name : s.theme,
        content: s.pages ? s.pages.map((p: any) => p.text || '') : [],
        illustrations: s.pages ? s.pages.map((p: any, i: number) => ({
          sceneIndex: i,
          description: p.illustrationPrompt || '',
          imageUrl: p.illustrationUrl,
          style: 'storybook' as const,
        })) : [],
        duration: s.pages ? Math.ceil(s.pages.length * 0.5) : 5,
        createdAt: s.createdAt,
        characters: [],
        moral: s.moral,
        coverImageUrl: s.coverImageUrl,
        isCustom: s.isCustom,
      };
      saveStory(newStory);
      setStories([newStory, ...stories]);
      setSelectedStory(newStory);
      setCurrentPage(0);

      // Start generating illustrations for ALL pages in background
      startBackgroundIllustrationGeneration(newStory);
    } catch (error) {
      console.error('Failed to generate story:', error);
      alert('Failed to generate story. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = async (text: string) => {
    // Stop any existing speech
    window.speechSynthesis.cancel();
    if (isReading) {
      setIsReading(false);
      return;
    }

    if (selectedLanguage === 'en-IN') {
      // English: use browser SpeechSynthesis (unchanged behavior)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onend = () => setIsReading(false);
        window.speechSynthesis.speak(utterance);
        setIsReading(true);
      }
    } else {
      // Regional language: use Sarvam TTS
      setIsReading(true);
      try {
        const result = await apiService.getAudio(text, selectedLanguage);
        if (result.audioChunks && result.audioChunks.length > 0) {
          // Play audio chunks sequentially
          for (const chunk of result.audioChunks) {
            await new Promise<void>((resolve) => {
              const audio = new Audio(`data:audio/mp3;base64,${chunk}`);
              audio.onended = () => resolve();
              audio.onerror = () => resolve();
              audio.play().catch(() => resolve());
            });
          }
        }
      } catch {
        // Silent fail - TTS is optional
      } finally {
        setIsReading(false);
      }
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    apiService.updateUserLanguage(lang).catch(() => {}); // persist, non-blocking
  };

  // Generate illustration for a specific page of a given story
  // Accepts story directly to avoid stale closure issues during background generation
  const generateIllustrationForPage = useCallback(async (
    story: BedtimeStory,
    pageIndex: number,
    options?: { showSpinner?: boolean; setCover?: boolean }
  ) => {
    if (!child.profilePhoto) return;

    const cacheKey = `${story.id}-${pageIndex}`;

    // Guard: skip if already generating, cached, or has persisted URL
    if (generatingPagesRef.current.has(cacheKey)) return;
    if (story.illustrations[pageIndex]?.imageUrl) return;

    const illustration = story.illustrations[pageIndex];
    if (!illustration?.description) return;

    generatingPagesRef.current.add(cacheKey);
    if (options?.showSpinner) setGeneratingIllustration(pageIndex);

    try {
      const style = (illustration.style === 'realistic' ? 'storybook' : illustration.style) || 'storybook';
      const prompt = `Create a beautiful ${style} illustration for a children's bedtime story. Scene: ${illustration.description}. The main character is a child named ${child.name}. Make it child-friendly, warm, and magical.`;

      // Extract base64 from child photo if available
      let childPhotoBase64: string | undefined;
      if (child.profilePhoto && child.profilePhoto.startsWith('data:')) {
        childPhotoBase64 = child.profilePhoto.split(',')[1];
      }

      const result = await apiService.generateIllustration(prompt, childPhotoBase64);
      const imageUrl = result.data?.url ? `data:${result.data.mimeType};base64,${result.data.url}` : null;

      if (!imageUrl) return;

      // Update local cache immediately for instant display
      setIllustrationCache(prev => ({ ...prev, [cacheKey]: imageUrl }));

      // Persist to MinIO + MongoDB — fire-and-forget so background loop moves on quickly
      (async () => {
        try {
          const file = dataUrlToFile(imageUrl, `story-${story.id}-page-${pageIndex}.png`);
          const uploadResult = await apiService.uploadImage(file, 'stories');
          const persistedUrl = uploadResult?.url;

          if (persistedUrl) {
            await apiService.updateStoryPageIllustration(child.id, story.id, pageIndex + 1, persistedUrl);

            if (options?.setCover || pageIndex === 0) {
              await apiService.updateStoryCoverImage(child.id, story.id, persistedUrl);
              setStories(prev => prev.map(s =>
                s.id === story.id ? { ...s, coverImageUrl: persistedUrl } : s
              ));
              setSelectedStory(prev =>
                prev?.id === story.id ? { ...prev, coverImageUrl: persistedUrl } : prev
              );
            }

            setStories(prev => prev.map(s => {
              if (s.id !== story.id) return s;
              const updated = [...s.illustrations];
              updated[pageIndex] = { ...updated[pageIndex], imageUrl: persistedUrl };
              return { ...s, illustrations: updated };
            }));
            setSelectedStory(prev => {
              if (prev?.id !== story.id) return prev;
              const updated = [...prev.illustrations];
              updated[pageIndex] = { ...updated[pageIndex], imageUrl: persistedUrl };
              return { ...prev, illustrations: updated };
            });
            updateStory({ ...story, illustrations: story.illustrations.map((ill, i) =>
              i === pageIndex ? { ...ill, imageUrl: persistedUrl } : ill
            ) });
          }
        } catch (err) {
          console.error(`Failed to persist illustration for page ${pageIndex}:`, err);
        }
      })();
    } catch (error) {
      console.error(`Failed to generate illustration for page ${pageIndex}:`, error);
    } finally {
      generatingPagesRef.current.delete(cacheKey);
      if (options?.showSpinner) setGeneratingIllustration(null);
    }
  }, [child.profilePhoto, child.name, child.id]);

  // Generate all illustrations in background (called after story creation)
  const startBackgroundIllustrationGeneration = useCallback(async (story: BedtimeStory) => {
    if (!child.profilePhoto) return;
    for (let i = 0; i < story.illustrations.length; i++) {
      // Generate sequentially to avoid rate limits
      await generateIllustrationForPage(story, i);
    }
  }, [generateIllustrationForPage, child.profilePhoto]);

  // Fallback: generate illustration for current page when navigating existing stories
  useEffect(() => {
    if (!selectedStory || !child.profilePhoto) return;
    const hasCover = !!selectedStory.coverImageUrl;
    const contentIdx = hasCover ? currentPage - 1 : currentPage;
    if (contentIdx >= 0) {
      const cacheKey = `${selectedStory.id}-${contentIdx}`;
      // Only generate if not already in cache or generating
      if (!illustrationCache[cacheKey] && !generatingPagesRef.current.has(cacheKey)) {
        generateIllustrationForPage(selectedStory, contentIdx, { showSpinner: true });
      }
    }
  }, [currentPage, selectedStory?.id]);

  const downloadStoryPDF = () => {
    if (!selectedStory) return;
    // Build a printable HTML page with illustrations and trigger browser print-to-PDF
    const pages = selectedStory.content.map((text, i) => {
      const imgSrc = illustrationCache[`${selectedStory.id}-${i}`] || selectedStory.illustrations[i]?.imageUrl;
      const imgHtml = imgSrc
        ? `<div style="text-align:center;margin-bottom:20px;"><img src="${imgSrc}" alt="Illustration" style="max-width:100%;max-height:300px;border-radius:12px;object-fit:cover;" /></div>`
        : '';
      return `
      <div style="page-break-before:${i === 0 ? 'auto' : 'always'};padding:40px;font-family:Georgia,serif;">
        ${imgHtml}
        <p style="font-size:18px;line-height:1.8;color:#1e1b4b;">${text}</p>
      </div>
    `;
    }).join('');

    // Cover image at the top if available
    const coverSrc = selectedStory.coverImageUrl || illustrationCache[`${selectedStory.id}-0`] || selectedStory.illustrations[0]?.imageUrl;
    const coverHtml = coverSrc
      ? `<div style="text-align:center;padding:20px 40px;"><img src="${coverSrc}" alt="Cover" style="max-width:80%;max-height:400px;border-radius:16px;object-fit:cover;" /></div>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${selectedStory.title}</title>
  <style>
    @page { size: A5; margin: 20mm; }
    body { margin:0; background:#fff; }
    h1 { font-family:Georgia,serif; color:#6d28d9; text-align:center; padding:40px 40px 20px; }
    .moral { background:#fef3c7; border-left:4px solid #f59e0b; padding:16px 24px; margin:20px 40px; font-style:italic; }
  </style>
</head>
<body>
  <h1>${selectedStory.title}</h1>
  ${coverHtml}
  ${pages}
  ${selectedStory.moral ? `<div class="moral">&#10024; ${selectedStory.moral}</div>` : ''}
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => w.print();
    }
  };

  const StoryReader = () => {
    if (!selectedStory) return null;

    // If story has a cover, show it as "page -1" (index -1 shifts everything)
    const hasCover = !!selectedStory.coverImageUrl;
    const content = selectedStory.content;
    const totalPages = content.length + (hasCover ? 1 : 0);
    // when hasCover, currentPage=0 → cover, currentPage=1..n → content[0..n-1]
    const contentPageIndex = hasCover ? currentPage - 1 : currentPage;
    const isCoverPage = hasCover && currentPage === 0;
    const currentContent = isCoverPage ? '' : content[contentPageIndex] || '';
    const displayContent = isCoverPage
      ? ''
      : translatedPages
        ? (translatedPages[contentPageIndex] || currentContent)
        : currentContent;

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsReading(false);
                setTranslatedPages(null);
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
            {!isCoverPage && (
              <button
                onClick={() => speakText(displayContent)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isReading ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {isReading ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={downloadStoryPDF}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20"
              title="Download as PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <LanguagePicker value={selectedLanguage} onChange={handleLanguageChange} dark={true} />
          </div>
        </div>

        {/* Story Content */}
        <div className="px-6 pb-32">
          {/* Cover page */}
          {isCoverPage ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <img
                  src={selectedStory.coverImageUrl}
                  alt={`Cover: ${selectedStory.title}`}
                  className="w-full object-cover"
                />
              </div>
              <div className="text-center">
                <h2 className="text-white text-2xl font-bold font-serif mb-2">
                  {selectedStory.title}
                </h2>
                <p className="text-purple-200 text-sm">A story starring {child.name}</p>
                {selectedStory.isCustom && (
                  <span className="mt-2 inline-flex items-center gap-1 bg-violet-500/30 text-violet-200 text-xs px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Custom Story
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Illustration */}
              {(() => {
                const illustration = selectedStory.illustrations[contentPageIndex];
                const cacheKey = `${selectedStory.id}-${contentPageIndex}`;
                const cachedImage = illustrationCache[cacheKey] || illustration?.imageUrl;
                const isGeneratingThis = generatingIllustration === contentPageIndex;

                if (cachedImage) {
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

                return (
                  <div className="aspect-video bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl mb-6 flex items-center justify-center border border-white/10">
                    <div className="text-center text-white/60">
                      {child.profilePhoto ? (
                        <button
                          onClick={() => generateIllustrationForPage(selectedStory, contentPageIndex, { showSpinner: true })}
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
                {isTranslating ? (
                  <div className="flex items-center gap-3 text-white/60">
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    <p className="text-sm">Translating story...</p>
                  </div>
                ) : (
                  <p className="text-white text-lg leading-relaxed font-serif">
                    {displayContent}
                  </p>
                )}
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
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent px-6 py-8">
          {/* Progress dots — include cover dot if present */}
          <div className="flex gap-1 justify-center mb-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-1 rounded-full transition-all ${i === currentPage ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
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

  const handleCustomStoryCreated = (story: BedtimeStory) => {
    setStories([story, ...stories]);
    setSelectedStory(story);
    setCurrentPage(0);
    setShowCustomBuilder(false);

    // Start generating illustrations for ALL pages in background
    startBackgroundIllustrationGeneration(story);
  };

  if (showCustomBuilder) {
    return (
      <CustomStoryBuilder
        child={child}
        onStoryCreated={handleCustomStoryCreated}
        onCancel={() => setShowCustomBuilder(false)}
      />
    );
  }

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
              {/* Custom Story card — always first */}
              <button
                onClick={() => setShowCustomBuilder(true)}
                className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white text-left transition-transform hover:scale-[1.01] active:scale-[0.98] border border-purple-400/30 flex items-center gap-3"
              >
                <Wand2 className="w-8 h-8 text-amber-300 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Custom Story</span>
                  <span className="text-xs text-purple-200">Your characters, your setting, your adventure</span>
                </div>
              </button>

              {allThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleGenerateStory(theme.id)}
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
                    {(story.coverImageUrl || story.illustrations[0]?.imageUrl || illustrationCache[`${story.id}-0`]) ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={story.coverImageUrl || story.illustrations[0]?.imageUrl || illustrationCache[`${story.id}-0`]}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                    )}
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
