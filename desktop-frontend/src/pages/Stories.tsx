import { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from '../components/TopBar';
import {
    Sparkles, Moon, Heart, ChevronLeft, ChevronRight, Loader2, RefreshCw,
    Star, Play, Pause, Square, X, BookOpen, Wand2, Trash2, Download,
    Plus, MapPin, Zap, User
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api from '../api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoryPage {
    text: string;
    pageNumber?: number;
    illustrationPrompt?: string;
    illustrationUrl?: string;
}

interface Story {
    _id: string;
    title: string;
    theme: { id: string; name: string; emoji: string; colorHex: string } | string;
    pages: StoryPage[];
    moral: string;
    coverImageUrl?: string;
    isFavorite: boolean;
    isCustom?: boolean;
    customConfig?: { characters?: string[]; setting?: string; action?: string; customPrompt?: string };
    timesRead: number;
    childAgeAtCreation: number;
    createdAt: string;
}

interface StoryTheme {
    id: string;
    name: string;
    emoji: string;
    description: string;
    colorHex: string;
}

// ─── ChipInput (for custom story builder) ────────────────────────────────────

function ChipInput({
    label,
    placeholder,
    chips,
    onChange,
    icon,
}: {
    label: string;
    placeholder: string;
    chips: string[];
    onChange: (chips: string[]) => void;
    icon: React.ReactNode;
}) {
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
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                {icon}
                {label}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[48px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300 transition">
                {chips.map((chip, i) => (
                    <span
                        key={i}
                        className="flex items-center gap-1 bg-purple-100 text-purple-700 text-sm rounded-full px-3 py-1 font-medium"
                    >
                        {chip}
                        <button
                            onClick={() => removeChip(i)}
                            className="text-purple-400 hover:text-purple-700 ml-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    className="bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm flex-1 min-w-[120px]"
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
                    <button onClick={addChip} className="text-purple-400 hover:text-purple-600">
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Settings / Presets for Custom Story Builder ─────────────────────────────

const SETTING_OPTIONS = [
    { value: 'enchanted-forest', label: 'Enchanted Forest', emoji: '🌳' },
    { value: 'outer-space', label: 'Outer Space', emoji: '🚀' },
    { value: 'underwater-kingdom', label: 'Underwater Kingdom', emoji: '🐠' },
    { value: 'magical-castle', label: 'Magical Castle', emoji: '🏰' },
    { value: 'candy-land', label: 'Candy Land', emoji: '🍭' },
    { value: 'dinosaur-valley', label: 'Dinosaur Valley', emoji: '🦕' },
    { value: 'cloud-city', label: 'Cloud City', emoji: '☁️' },
    { value: 'pirate-ship', label: 'Pirate Ship', emoji: '🏴‍☠️' },
];

const MORAL_OPTIONS = [
    'Kindness', 'Bravery', 'Honesty', 'Sharing', 'Friendship',
    'Perseverance', 'Gratitude', 'Curiosity', 'Empathy', 'Teamwork',
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Stories() {
    const { activeChild } = useChild();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [stories, setStories] = useState<Story[]>([]);
    const [themes, setThemes] = useState<StoryTheme[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [readingStory, setReadingStory] = useState<Story | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    // Custom story builder
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);

    // Delete confirmation
    const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Text-to-speech
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Custom story builder state
    const [customCharacters, setCustomCharacters] = useState<string[]>([]);
    const [customSetting, setCustomSetting] = useState('');
    const [customAction, setCustomAction] = useState('');
    const [customMoral, setCustomMoral] = useState('');
    const [customDetails, setCustomDetails] = useState('');

    const child = activeChild;

    // ─── Fetch themes ─────────────────────────────────────────────────────

    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const response = await api.get('/stories/themes');
                setThemes(response.data.themes || []);
            } catch (error) {
                console.error('Failed to fetch themes:', error);
                setThemes([
                    { id: 'adventure', name: 'Adventure', emoji: '🌟', description: 'Exciting journeys', colorHex: '#F59E0B' },
                    { id: 'animals', name: 'Animals', emoji: '🐾', description: 'Animal friends', colorHex: '#10B981' },
                    { id: 'kindness', name: 'Kindness', emoji: '💝', description: 'Being kind', colorHex: '#EC4899' },
                    { id: 'nature', name: 'Nature', emoji: '🌿', description: 'Nature exploration', colorHex: '#22C55E' },
                    { id: 'space', name: 'Space', emoji: '🚀', description: 'Space exploration', colorHex: '#6366F1' },
                    { id: 'friendship', name: 'Friendship', emoji: '🤝', description: 'Being a good friend', colorHex: '#EC4899' },
                ]);
            }
        };
        fetchThemes();
    }, []);

    // ─── Fetch stories ────────────────────────────────────────────────────

    const fetchStories = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        try {
            const response = await api.get(`/stories/${child._id}`);
            setStories(response.data.stories || []);
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        } finally {
            setLoading(false);
        }
    }, [child?._id]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    // ─── Stop speech on unmount or story change ───────────────────────────

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        stopSpeaking();
    }, [currentPage, readingStory?._id]);

    // ─── Generate themed story ────────────────────────────────────────────

    const generateStory = async (themeId: string) => {
        if (!child?._id) return;
        setGenerating(true);
        try {
            const response = await api.post('/stories', {
                childId: child._id,
                themeId,
            });
            const newStory = response.data.story;
            setStories(prev => [newStory, ...prev]);
            setSelectedTheme(null);
            openStory(newStory);
        } catch (error: any) {
            console.error('Failed to generate story:', error);
            alert(error.response?.data?.error || 'Failed to generate story. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ─── Generate custom story ────────────────────────────────────────────

    const generateCustomStory = async () => {
        if (!child?._id) return;
        setGenerating(true);
        try {
            const response = await api.post('/stories/custom', {
                childId: child._id,
                characters: customCharacters,
                setting: customSetting.trim(),
                action: customAction.trim(),
                customPrompt: [
                    customMoral ? `Moral lesson: ${customMoral}` : '',
                    customDetails.trim(),
                ].filter(Boolean).join('. '),
            });
            const newStory = response.data.story;
            setStories(prev => [newStory, ...prev]);
            setShowCustomBuilder(false);
            resetCustomBuilder();
            openStory(newStory);
        } catch (error: any) {
            console.error('Failed to generate custom story:', error);
            alert(error.response?.data?.error || 'Failed to generate custom story. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const resetCustomBuilder = () => {
        setCustomCharacters([]);
        setCustomSetting('');
        setCustomAction('');
        setCustomMoral('');
        setCustomDetails('');
    };

    // ─── Open story (fetch full version) ──────────────────────────────────

    const openStory = async (story: Story) => {
        try {
            const response = await api.get(`/stories/${child!._id}/${story._id}`);
            setReadingStory(response.data.story);
            setCurrentPage(0);
        } catch (error) {
            console.error('Failed to open story:', error);
            setReadingStory(story);
            setCurrentPage(0);
        }
    };

    // ─── Toggle favorite ──────────────────────────────────────────────────

    const toggleFavorite = async (storyId: string) => {
        try {
            const response = await api.patch(`/stories/${child!._id}/${storyId}/favorite`);
            const isFavorite = response.data.isFavorite;
            setStories(prev => prev.map(s => s._id === storyId ? { ...s, isFavorite } : s));
            if (readingStory && readingStory._id === storyId) {
                setReadingStory(prev => prev ? { ...prev, isFavorite } : null);
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    // ─── Delete story ─────────────────────────────────────────────────────

    const deleteStory = async (storyId: string) => {
        if (!child?._id) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/stories/${child._id}/${storyId}`);
            setStories(prev => prev.filter(s => s._id !== storyId));
            if (readingStory?._id === storyId) {
                setReadingStory(null);
            }
            setDeletingStoryId(null);
        } catch (error) {
            console.error('Failed to delete story:', error);
            alert('Failed to delete story. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ─── Text-to-Speech ───────────────────────────────────────────────────

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // ─── PDF Download ─────────────────────────────────────────────────────

    const downloadStoryPDF = () => {
        if (!readingStory) return;

        const pages = readingStory.pages.map((page, i) => {
            const imgHtml = page.illustrationUrl
                ? `<div style="text-align:center;margin-bottom:20px;"><img src="${page.illustrationUrl}" alt="Illustration" style="max-width:100%;max-height:300px;border-radius:12px;object-fit:cover;" /></div>`
                : '';
            return `
            <div style="page-break-before:${i === 0 ? 'auto' : 'always'};padding:40px;font-family:Georgia,serif;">
                ${imgHtml}
                <p style="font-size:18px;line-height:1.8;color:#1e1b4b;">${page.text}</p>
            </div>`;
        }).join('');

        const coverSrc = readingStory.coverImageUrl || readingStory.pages[0]?.illustrationUrl;
        const coverHtml = coverSrc
            ? `<div style="text-align:center;padding:20px 40px;"><img src="${coverSrc}" alt="Cover" style="max-width:80%;max-height:400px;border-radius:16px;object-fit:cover;" /></div>`
            : '';

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>${readingStory.title}</title>
    <style>
        @page { size: A5; margin: 20mm; }
        body { margin:0; background:#fff; }
        h1 { font-family:Georgia,serif; color:#6d28d9; text-align:center; padding:40px 40px 20px; }
        .moral { background:#fef3c7; border-left:4px solid #f59e0b; padding:16px 24px; margin:20px 40px; font-style:italic; border-radius:8px; }
    </style>
</head>
<body>
    <h1>${readingStory.title}</h1>
    ${coverHtml}
    ${pages}
    ${readingStory.moral ? `<div class="moral">&#10024; Moral: ${readingStory.moral}</div>` : ''}
</body>
</html>`;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
            w.onload = () => w.print();
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────────

    const getThemeName = (theme: Story['theme']): string => {
        if (typeof theme === 'object' && theme?.name) return theme.name;
        if (typeof theme === 'string') return theme;
        return 'Bedtime Story';
    };

    const getThemeEmoji = (theme: Story['theme']): string => {
        if (typeof theme === 'object' && theme?.emoji) return theme.emoji;
        return '📖';
    };

    const getThemeColor = (theme: Story['theme']): string => {
        if (typeof theme === 'object' && theme?.colorHex) return theme.colorHex;
        return '#10B981';
    };

    // ─── No child selected ────────────────────────────────────────────────

    if (!child) {
        return (
            <>
                <TopBar title="Bedtime Stories" subtitle="Generate magical tales for your little one" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view stories.</p>
                </div>
            </>
        );
    }

    // ─── Delete Confirmation Modal ────────────────────────────────────────

    const DeleteConfirmModal = () => {
        if (!deletingStoryId) return null;
        const story = stories.find(s => s._id === deletingStoryId);
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Story?</h3>
                    <p className="text-gray-500 text-center mb-6">
                        Are you sure you want to delete <strong>"{story?.title}"</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeletingStoryId(null)}
                            disabled={deleteLoading}
                            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => deleteStory(deletingStoryId)}
                            disabled={deleteLoading}
                            className="flex-1 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Custom Story Builder Modal ───────────────────────────────────────

    const CustomStoryBuilderModal = () => {
        if (!showCustomBuilder) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
                <div className="bg-white rounded-[28px] shadow-2xl max-w-2xl w-full mx-4 my-auto max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white rounded-t-[28px] border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-500" />
                                Create Custom Story
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Design a unique adventure for {child.name}</p>
                        </div>
                        <button
                            onClick={() => { setShowCustomBuilder(false); resetCustomBuilder(); }}
                            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                        {/* Characters */}
                        <ChipInput
                            label="Friends & Characters"
                            placeholder="e.g. Teddy Bear, Princess Luna... press Enter"
                            chips={customCharacters}
                            onChange={setCustomCharacters}
                            icon={<User className="w-4 h-4 text-purple-500" />}
                        />

                        {/* Setting */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 text-purple-500" />
                                Where does the story happen?
                            </label>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {SETTING_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setCustomSetting(customSetting === opt.label ? '' : opt.label)}
                                        className={`p-2.5 rounded-xl text-center text-xs font-semibold transition-all border ${customSetting === opt.label
                                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg block mb-0.5">{opt.emoji}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 text-sm transition"
                                placeholder="Or type a custom setting..."
                                value={customSetting}
                                onChange={(e) => setCustomSetting(e.target.value)}
                            />
                        </div>

                        {/* Action / Plot */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Zap className="w-4 h-4 text-purple-500" />
                                What happens? (the adventure)
                            </label>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 text-sm transition"
                                placeholder="e.g. finds a lost puppy, saves the rainbow, discovers a treasure map..."
                                value={customAction}
                                onChange={(e) => setCustomAction(e.target.value)}
                            />
                        </div>

                        {/* Moral / Theme */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Star className="w-4 h-4 text-purple-500" />
                                Moral / Life Lesson
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {MORAL_OPTIONS.map(moral => (
                                    <button
                                        key={moral}
                                        onClick={() => setCustomMoral(customMoral === moral ? '' : moral)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${customMoral === moral
                                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {moral}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Additional details */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                Additional Details (optional)
                            </label>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 text-sm resize-none transition"
                                placeholder="Any special details, e.g. 'make it funny', 'include a dragon', 'use rhyming language'..."
                                rows={3}
                                value={customDetails}
                                onChange={(e) => setCustomDetails(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white rounded-b-[28px] border-t border-gray-100 px-8 py-5 flex items-center justify-end gap-3">
                        <button
                            onClick={() => { setShowCustomBuilder(false); resetCustomBuilder(); }}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={generateCustomStory}
                            disabled={generating}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold hover:from-purple-600 hover:to-violet-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Creating story...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" /> Create Story
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  STORY READER MODE
    // ═══════════════════════════════════════════════════════════════════════

    if (readingStory) {
        const hasCover = !!readingStory.coverImageUrl;
        const pages = readingStory.pages || [];
        const totalPages = pages.length + (hasCover ? 1 : 0);
        const isCoverPage = hasCover && currentPage === 0;
        const contentPageIndex = hasCover ? currentPage - 1 : currentPage;
        const page = isCoverPage ? null : pages[contentPageIndex];

        return (
            <>
                <TopBar title={readingStory.title} subtitle={`${getThemeName(readingStory.theme)} Story`} />
                <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center">
                    <div className="w-full max-w-3xl">
                        {/* Top Nav Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => {
                                    stopSpeaking();
                                    setReadingStory(null);
                                }}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition"
                            >
                                <ChevronLeft className="w-5 h-5" /> Back to Library
                            </button>
                            <div className="flex items-center gap-2">
                                {/* TTS Controls */}
                                {!isCoverPage && page?.text && (
                                    <button
                                        onClick={() => speakText(page.text)}
                                        className={`p-2 rounded-full transition ${isSpeaking
                                            ? 'bg-amber-100 text-amber-600'
                                            : 'bg-gray-100 text-gray-500 hover:text-purple-500 hover:bg-purple-50'
                                            }`}
                                        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                                    >
                                        {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                )}
                                {isSpeaking && (
                                    <button
                                        onClick={stopSpeaking}
                                        className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                                        title="Stop"
                                    >
                                        <Square className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Download PDF */}
                                <button
                                    onClick={downloadStoryPDF}
                                    className="p-2 rounded-full bg-gray-100 text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition"
                                    title="Download as PDF"
                                >
                                    <Download className="w-5 h-5" />
                                </button>

                                {/* Favorite */}
                                <button
                                    onClick={() => toggleFavorite(readingStory._id)}
                                    className={`p-2 rounded-full transition ${readingStory.isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-400'}`}
                                >
                                    <Heart className={`w-5 h-5 ${readingStory.isFavorite ? 'fill-red-500' : ''}`} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => setDeletingStoryId(readingStory._id)}
                                    className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                    title="Delete story"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                <span className="text-sm text-gray-400 font-medium ml-2">
                                    {isCoverPage ? 'Cover' : `Page ${contentPageIndex + 1} of ${pages.length}`}
                                </span>
                            </div>
                        </div>

                        {/* Story Page Card */}
                        <div className="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                            {/* Cover Page */}
                            {isCoverPage ? (
                                <div className="flex flex-col items-center justify-center flex-1 p-8">
                                    <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl border border-gray-100 mb-6">
                                        <img
                                            src={readingStory.coverImageUrl}
                                            alt={`Cover: ${readingStory.title}`}
                                            className="w-full object-cover"
                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                        />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-2 font-heading">
                                        {readingStory.title}
                                    </h2>
                                    <p className="text-gray-500 text-center">A story starring {child.name}</p>
                                    {readingStory.isCustom && (
                                        <span className="mt-3 inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <Sparkles className="w-3 h-3" /> Custom Story
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Illustration */}
                                    {page?.illustrationUrl ? (
                                        <div className="w-full h-72 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                            <img
                                                src={page.illustrationUrl}
                                                alt="Story illustration"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="text-7xl block mb-2">{getThemeEmoji(readingStory.theme)}</span>
                                                {page?.illustrationPrompt && (
                                                    <p className="text-sm text-purple-400 italic max-w-xs">
                                                        {page.illustrationPrompt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Story Text */}
                                    <div className="p-8 flex-1 flex flex-col justify-center">
                                        <p className="text-xl leading-relaxed text-gray-800 font-medium">
                                            {page?.text || 'Loading...'}
                                        </p>
                                    </div>

                                    {/* Moral (on last content page) */}
                                    {contentPageIndex === pages.length - 1 && readingStory.moral && (
                                        <div className="px-8 pb-6">
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                                <p className="text-amber-800 font-medium text-sm flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-amber-500" />
                                                    Moral: {readingStory.moral}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" /> Previous
                            </button>

                            {/* Page dots */}
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`h-2.5 rounded-full transition-all ${i === currentPage
                                            ? 'bg-emerald-500 w-6'
                                            : i === 0 && hasCover
                                                ? 'bg-purple-300 hover:bg-purple-400 w-2.5'
                                                : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                                            }`}
                                        title={i === 0 && hasCover ? 'Cover' : `Page ${hasCover ? i : i + 1}`}
                                    />
                                ))}
                            </div>

                            {currentPage < totalPages - 1 ? (
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition"
                                >
                                    Next <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        stopSpeaking();
                                        setReadingStory(null);
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition"
                                >
                                    The End
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DeleteConfirmModal />
            </>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LIBRARY VIEW (main)
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <>
            <TopBar title="Bedtime Stories" subtitle={`Magical tales for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* Main Content */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Generate Story Section */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-8 text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 bg-white/20 w-max px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <Wand2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">AI Story Generator</span>
                            </div>
                            <h2 className="text-2xl font-bold font-heading mb-2">Create a New Story</h2>
                            <p className="text-white/80 font-medium mb-6">
                                Choose a theme and our AI will create a personalized bedtime story for {child.name}!
                            </p>

                            {/* Custom Story Button */}
                            <button
                                onClick={() => setShowCustomBuilder(true)}
                                disabled={generating}
                                className="w-full mb-4 p-4 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-left transition flex items-center gap-3 disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-amber-400/30 rounded-xl flex items-center justify-center">
                                    <Wand2 className="w-5 h-5 text-amber-300" />
                                </div>
                                <div>
                                    <span className="font-bold block">Custom Story</span>
                                    <span className="text-xs text-white/70">Your characters, your setting, your adventure</span>
                                </div>
                                <ChevronRight className="w-5 h-5 ml-auto text-white/50" />
                            </button>

                            {/* Theme Selector */}
                            <div className="flex flex-wrap gap-3">
                                {themes.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setSelectedTheme(theme.id === selectedTheme ? null : theme.id)}
                                        disabled={generating}
                                        className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${selectedTheme === theme.id
                                            ? 'bg-white text-purple-600 shadow-lg scale-105'
                                            : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                                            } disabled:opacity-50`}
                                    >
                                        <span className="text-xl">{theme.emoji}</span>
                                        {theme.name}
                                    </button>
                                ))}
                            </div>

                            {selectedTheme && (
                                <button
                                    onClick={() => generateStory(selectedTheme)}
                                    disabled={generating}
                                    className="mt-6 bg-white text-purple-600 font-bold px-8 py-3.5 rounded-xl hover:bg-purple-50 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Creating magical story...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" /> Generate Story
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -left-10 top-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />
                    </div>

                    {/* Story Library */}
                    <h3 className="text-xl font-bold font-heading text-gray-900 mt-2">
                        Story Library
                        {stories.length > 0 && <span className="text-sm text-gray-400 font-medium ml-2">({stories.length} stories)</span>}
                    </h3>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : stories.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map(story => (
                                <div
                                    key={story._id}
                                    className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 relative"
                                >
                                    {/* Click to open */}
                                    <div onClick={() => openStory(story)}>
                                        {/* Cover */}
                                        <div
                                            className="h-44 flex items-center justify-center text-6xl relative"
                                            style={{
                                                background: `linear-gradient(135deg, ${getThemeColor(story.theme)}20, ${getThemeColor(story.theme)}40)`,
                                            }}
                                        >
                                            {story.coverImageUrl ? (
                                                <img
                                                    src={story.coverImageUrl}
                                                    alt={story.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display: flex');
                                                    }}
                                                />
                                            ) : null}
                                            <span className={story.coverImageUrl ? 'absolute hidden' : 'text-6xl'}>
                                                {getThemeEmoji(story.theme)}
                                            </span>

                                            {/* Custom story badge */}
                                            {story.isCustom && (
                                                <div className="absolute top-3 left-3 bg-purple-500/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-white" />
                                                    <span className="text-white text-[10px] font-bold">Custom</span>
                                                </div>
                                            )}

                                            {/* Favorite badge */}
                                            {story.isFavorite && (
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                                                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                                </div>
                                            )}

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="bg-white rounded-full p-3 shadow-lg">
                                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <h4 className="font-bold text-gray-900 leading-tight mb-2 group-hover:text-purple-600 transition line-clamp-2">
                                                {story.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-auto">
                                                <span className="flex items-center gap-1">
                                                    <Moon className="w-3.5 h-3.5" /> {getThemeName(story.theme)}
                                                </span>
                                                <span>·</span>
                                                <span>{story.pages?.length || 0} pages</span>
                                                {story.timesRead > 0 && (
                                                    <>
                                                        <span>·</span>
                                                        <span>Read {story.timesRead}x</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete button on card */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeletingStoryId(story._id); }}
                                        className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete story"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-50 shadow-sm">
                            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">📖</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Stories Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Choose a theme above and let our AI create a magical bedtime story for {child.name}!
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="xl:w-1/4 flex flex-col gap-6">

                    {/* Favorites */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold font-heading text-lg text-gray-900">Favorites</h3>
                            <span className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                                {stories.filter(s => s.isFavorite).length}
                            </span>
                        </div>

                        {stories.filter(s => s.isFavorite).length > 0 ? (
                            stories
                                .filter(s => s.isFavorite)
                                .slice(0, 5)
                                .map(story => (
                                    <div
                                        key={story._id}
                                        onClick={() => openStory(story)}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 py-1 -mx-2 px-2 rounded-lg transition"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${getThemeColor(story.theme)}20` }}
                                        >
                                            {getThemeEmoji(story.theme)}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{story.title}</h4>
                                            <p className="text-xs text-gray-500">{getThemeName(story.theme)}</p>
                                        </div>
                                        <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
                                    </div>
                                ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No favorites yet. Tap the heart icon while reading a story to save it!</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="font-bold font-heading text-lg text-gray-900 mb-4">Story Stats</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex flex-col gap-1 p-3 bg-purple-50 rounded-xl">
                                <span className="text-2xl font-bold font-heading text-purple-600">{stories.length}</span>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stories</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-blue-50 rounded-xl">
                                <span className="text-2xl font-bold font-heading text-blue-600">
                                    {stories.reduce((sum, s) => sum + (s.timesRead || 0), 0)}
                                </span>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Reads</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-red-50 rounded-xl">
                                <span className="text-2xl font-bold font-heading text-red-500">
                                    {stories.filter(s => s.isFavorite).length}
                                </span>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Favorites</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-amber-50 rounded-xl">
                                <span className="text-2xl font-bold font-heading text-amber-600">
                                    {stories.filter(s => s.isCustom).length}
                                </span>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Custom</span>
                            </div>
                        </div>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchStories}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 bg-white text-purple-600 border border-purple-200 font-semibold py-3 rounded-xl hover:bg-purple-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Library
                    </button>
                </div>
            </div>

            {/* Modals */}
            <CustomStoryBuilderModal />
            <DeleteConfirmModal />
        </>
    );
}
