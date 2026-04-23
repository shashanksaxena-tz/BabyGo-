import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  User,
  MapPin,
  Zap,
  Loader2,
} from 'lucide-react';
import { ChildProfile, BedtimeStory } from '../types';
import apiService from '../services/apiService';
import { saveStory } from '../services/storageService';

interface CharacterImage {
  name: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
}

interface CustomStoryBuilderProps {
  child: ChildProfile;
  onStoryCreated: (story: BedtimeStory) => void;
  onCancel: () => void;
}

// ---------- tiny helpers ----------

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/jpeg;base64,"
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ---------- ChipInput component ----------

const ChipInput: React.FC<{
  label: string;
  placeholder: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  icon: React.ReactNode;
}> = ({ label, placeholder, chips, onChange, icon }) => {
  const [input, setInput] = useState('');

  const addChip = () => {
    const val = input.trim();
    if (val && !chips.includes(val)) {
      onChange([...chips, val]);
    }
    setInput('');
  };

  const removeChip = (idx: number) => {
    onChange(chips.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
        {icon}
        {label}
      </label>
      <div className="bg-white/10 rounded-xl p-3 min-h-[52px] flex flex-wrap gap-2 items-center">
        {chips.map((chip, i) => (
          <span
            key={i}
            className="flex items-center gap-1 bg-purple-500/50 text-white text-sm rounded-full px-3 py-1"
          >
            {chip}
            <button
              onClick={() => removeChip(i)}
              className="text-purple-200 hover:text-white ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          className="bg-transparent text-white placeholder-purple-300/60 outline-none text-sm flex-1 min-w-[120px]"
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addChip();
            }
          }}
        />
        {input.trim() && (
          <button
            onClick={addChip}
            className="text-purple-300 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Main component ----------

const CustomStoryBuilder: React.FC<CustomStoryBuilderProps> = ({
  child,
  onStoryCreated,
  onCancel,
}) => {
  const [characters, setCharacters] = useState<string[]>([]);
  const [setting, setSetting] = useState('');
  const [action, setAction] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Child avatar (story-specific)
  const [childAvatar, setChildAvatar] = useState<{
    base64: string; mimeType: string; previewUrl: string;
  } | null>(null);

  // Character images (mapped by character name)
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);

  const childAvatarInputRef = useRef<HTMLInputElement>(null);
  const charImageInputRef = useRef<HTMLInputElement>(null);
  const pendingCharNameRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // ---- voice input ----
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const Recognition = SpeechRecognitionAPI;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setCustomPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  // ---- child avatar upload ----
  const handleChildAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const { base64, mimeType } = await fileToBase64(file);
    setChildAvatar({ base64, mimeType, previewUrl });
    e.target.value = '';
  };

  // ---- character image upload ----
  const triggerCharImageUpload = (charName: string) => {
    pendingCharNameRef.current = charName;
    charImageInputRef.current?.click();
  };

  const handleCharImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const name = pendingCharNameRef.current;
    if (!file || !name) return;
    const previewUrl = URL.createObjectURL(file);
    const { base64, mimeType } = await fileToBase64(file);
    setCharacterImages((prev) => {
      const filtered = prev.filter((ci) => ci.name !== name);
      return [...filtered, { name, base64, mimeType, previewUrl }];
    });
    e.target.value = '';
  };

  // ---- generate ----
  const handleCreate = async () => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateCustomStory({
        childId: child.id,
        customPrompt: customPrompt.trim(),
        characters,
        setting: setting.trim(),
        action: action.trim(),
        characterImages: characterImages.map(({ name, base64, mimeType }) => ({
          name, base64, mimeType,
        })),
        childAvatarImage: childAvatar
          ? { base64: childAvatar.base64, mimeType: childAvatar.mimeType }
          : null,
      });

      const data = (result as any).data;
      if (!data?.story) throw new Error((result as any).error || 'Story generation failed');

      const s = data.story;
      const newStory: BedtimeStory = {
        id: s._id || s.id,
        childId: s.childId,
        title: s.title,
        theme: typeof s.theme === 'object' ? s.theme.name : (s.theme || 'Custom Story'),
        content: s.pages ? s.pages.map((p: any) => p.text || '') : [],
        illustrations: s.pages
          ? s.pages.map((p: any, i: number) => ({
              sceneIndex: i,
              description: p.illustrationPrompt || '',
              imageUrl: p.illustrationUrl,
              style: 'storybook' as const,
            }))
          : [],
        duration: s.pages ? Math.ceil(s.pages.length * 0.5) : 5,
        createdAt: s.createdAt,
        characters: [],
        moral: s.moral,
        isCustom: true,
        coverImageUrl: s.coverImageUrl,
        customConfig: s.customConfig,
      };

      saveStory(newStory);
      onStoryCreated(newStory);
    } catch (error) {
      console.error('Custom story failed:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-300 mx-auto mb-6 animate-spin" />
          <p className="text-white text-xl font-bold mb-2">Weaving your story...</p>
          <p className="text-purple-200 text-sm">
            Creating a magical adventure for {child.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onCancel}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">Create Your Story</h1>
            <p className="text-purple-200 text-sm">Starring {child.name}!</p>
          </div>
          <Sparkles className="w-7 h-7 text-amber-300" />
        </div>
      </div>

      <div className="px-6 pb-32 space-y-6">
        {/* Child info card */}
        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
          {child.profilePhoto ? (
            <img
              src={child.profilePhoto}
              alt={child.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500/50 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{child.name}</p>
            <p className="text-purple-200 text-sm">Main hero · always in the story</p>
          </div>
        </div>

        {/* Characters */}
        <ChipInput
          label="Friends & Toys"
          placeholder="e.g. Teddy, Priya… press Enter"
          chips={characters}
          onChange={setCharacters}
          icon={<User className="w-4 h-4 text-purple-300" />}
        />

        {/* Setting */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
            <MapPin className="w-4 h-4 text-purple-300" />
            Where does the story happen?
          </label>
          <input
            className="w-full bg-white/10 text-white placeholder-purple-300/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="e.g. a magical forest, outer space, grandma's kitchen…"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
          />
        </div>

        {/* Action / Plot */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
            <Zap className="w-4 h-4 text-purple-300" />
            What happens? (the adventure)
          </label>
          <input
            className="w-full bg-white/10 text-white placeholder-purple-300/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="e.g. finds a lost puppy, saves the rainbow…"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>

        {/* Advanced Settings */}
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 text-purple-200 hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium">Advanced Settings</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 space-y-5 border-t border-white/10 pt-4">
              {/* Child's story avatar */}
              <div>
                <p className="text-sm font-medium text-purple-200 mb-2">
                  {child.name}'s Story Avatar
                </p>
                <p className="text-xs text-purple-300/70 mb-3">
                  Upload a special image (a drawing, sticker, or photo) that represents{' '}
                  {child.name} in this story.
                </p>
                <div className="flex items-center gap-3">
                  {childAvatar ? (
                    <div className="relative">
                      <img
                        src={childAvatar.previewUrl}
                        alt="Child avatar"
                        className="w-16 h-16 rounded-xl object-cover border border-purple-400"
                      />
                      <button
                        onClick={() => setChildAvatar(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => childAvatarInputRef.current?.click()}
                      className="flex items-center gap-2 bg-purple-500/30 hover:bg-purple-500/50 text-white rounded-xl px-4 py-3 text-sm transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Avatar
                    </button>
                  )}
                </div>
                <input
                  ref={childAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChildAvatarChange}
                />
              </div>

              {/* Character photos */}
              {characters.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-purple-200 mb-2">
                    Photos of Friends & Toys
                  </p>
                  <p className="text-xs text-purple-300/70 mb-3">
                    Upload a photo so the AI can describe them accurately in the story.
                  </p>
                  <div className="space-y-2">
                    {characters.map((name) => {
                      const img = characterImages.find((ci) => ci.name === name);
                      return (
                        <div key={name} className="flex items-center gap-3">
                          {img ? (
                            <div className="relative flex-shrink-0">
                              <img
                                src={img.previewUrl}
                                alt={name}
                                className="w-12 h-12 rounded-xl object-cover border border-purple-400"
                              />
                              <button
                                onClick={() =>
                                  setCharacterImages((prev) =>
                                    prev.filter((ci) => ci.name !== name)
                                  )
                                }
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => triggerCharImageUpload(name)}
                              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                            >
                              <Upload className="w-4 h-4 text-purple-300" />
                            </button>
                          )}
                          <span className="text-white text-sm">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <input
                    ref={charImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCharImageChange}
                  />
                </div>
              )}

              {/* Voice / extra instructions */}
              <div>
                <p className="text-sm font-medium text-purple-200 mb-2">
                  Extra Instructions
                </p>
                <div className="relative">
                  <textarea
                    className="w-full bg-white/10 text-white placeholder-purple-300/60 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none"
                    placeholder="Any special details, e.g. 'make it funny', 'include a dragon'…"
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  {SpeechRecognitionAPI && (
                    <button
                      onClick={toggleVoice}
                      className={`absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-white/20 text-purple-300 hover:bg-white/30'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {isListening && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block" />
                    Listening… speak now
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Create button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <button
          onClick={handleCreate}
          disabled={isGenerating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Create {child.name}'s Story
        </button>
      </div>
    </div>
  );
};

export default CustomStoryBuilder;
