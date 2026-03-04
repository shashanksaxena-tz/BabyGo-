import { useState, useEffect, useRef } from 'react';
import TopBar from '../components/TopBar';
import { Camera, Info, CheckCircle2, ChevronRight, Loader2, X, Play, FileVideo } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useChild } from '../contexts/ChildContext';
import api from '../api';
import { format } from 'date-fns';

interface AnalysisRecord {
    _id: string;
    overallScore: number;
    overallStatus: string;
    summary: string;
    createdAt: string;
    motorAssessment?: { score: number; status: string };
    cognitiveAssessment?: { score: number; status: string };
    languageAssessment?: { score: number; status: string };
    socialAssessment?: { score: number; status: string };
}

export default function Analysis() {
    const { activeChild } = useChild();
    const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const child = activeChild;

    useEffect(() => {
        if (!child?._id) return;
        fetchAnalyses();
    }, [child?._id]);

    const fetchAnalyses = async () => {
        if (!child?._id) return;
        setLoading(true);
        try {
            const response = await api.get(`/analysis/${child._id}`);
            setAnalyses(response.data.analyses || []);
        } catch (error) {
            console.error('Failed to fetch analyses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];
            return validTypes.includes(file.type);
        });
        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const submitAnalysis = async () => {
        if (!child?._id || selectedFiles.length === 0) return;
        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('childId', child._id);
            selectedFiles.forEach(file => formData.append('media', file));

            const response = await api.post('/analysis', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(percent);
                },
            });

            setSelectedFiles([]);
            fetchAnalyses();
            // Navigate to result page with the analysis data
            navigate('/analysis/result', { state: { analysis: response.data.analysis } });
        } catch (error: any) {
            console.error('Analysis failed:', error);
            alert(error.response?.data?.error || 'Failed to analyze. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    if (!child) {
        return (
            <>
                <TopBar title="Development Analysis" subtitle="Upload and analyze your child's development" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to perform an analysis.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar title="Development Analysis" subtitle={`Analyze ${child.name}'s development`} />
            <div className="flex-1 p-8 grid lg:grid-cols-3 gap-8 overflow-y-auto">

                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Upload Area */}
                    <div
                        className={`bg-white border-2 border-dashed rounded-[24px] rounded-br-[40px] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200 ${dragOver
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/mov,video/quicktime,image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                            <Camera className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Drop video here or click to upload</h3>
                        <p className="text-sm text-gray-500">Supports MP4, MOV, JPG, PNG. Max size 50MB.</p>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                            <h3 className="text-base font-bold text-gray-900 mb-4">Selected Files</h3>
                            <div className="flex flex-col gap-3 mb-4">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <FileVideo className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                                <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={submitAnalysis}
                                disabled={uploading}
                                className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-600 transition shadow-sm disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Analyzing...'}
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" /> Start Analysis
                                    </>
                                )}
                            </button>
                            {uploading && (
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* How It Works */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">How It Works</h3>
                        <div className="flex flex-col gap-5">
                            {[
                                { step: '1', bg: 'bg-emerald-500', title: 'Upload a Video', desc: 'Record or upload a 2-5 minute video of your child playing' },
                                { step: '2', bg: 'bg-teal-500', title: 'AI Analyzes Development', desc: 'Our AI evaluates motor, cognitive, language, and social skills' },
                                { step: '3', bg: 'bg-purple-500', title: 'Get Personalized Report', desc: 'Receive detailed insights and activity recommendations in minutes' },
                            ].map(item => (
                                <div key={item.step} className="flex gap-4 items-start">
                                    <div className={`w-8 h-8 rounded-full ${item.bg} text-white flex items-center justify-center font-bold shrink-0 shadow-sm mt-0.5`}>
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Analyses */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50 mt-2">
                        <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Recent Analyses</h3>
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                </div>
                            ) : analyses.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                            <th className="font-semibold py-3 px-4 rounded-tl-xl">Date</th>
                                            <th className="font-semibold py-3 px-4">Score</th>
                                            <th className="font-semibold py-3 px-4">Status</th>
                                            <th className="font-semibold py-3 px-4 rounded-tr-xl">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {analyses.map((record) => (
                                            <tr key={record._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition">
                                                <td className="py-4 px-4 font-medium text-gray-800">
                                                    {format(new Date(record.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-emerald-500">
                                                    {record.overallScore ?? '—'}/100
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Link
                                                        to="/analysis/result"
                                                        state={{ analysis: record }}
                                                        className="text-emerald-500 font-semibold flex items-center gap-1 hover:text-emerald-600 transition"
                                                    >
                                                        View <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm">No analyses yet. Upload a video to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="flex flex-col gap-6">
                    {/* Tips */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">Tips for Best Results</h3>
                        <ul className="space-y-4 text-sm text-gray-700 font-medium">
                            {[
                                { color: 'bg-emerald-500', text: 'Use natural lighting for clarity' },
                                { color: 'bg-blue-500', text: 'Record at eye level with your child' },
                                { color: 'bg-purple-500', text: 'Include activities with toys or objects' },
                                { color: 'bg-pink-500', text: 'Capture interaction with caregivers' },
                                { color: 'bg-blue-500', text: 'Keep the camera steady — use a tripod if possible' },
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tip.color} mt-1.5 shrink-0`} />
                                    {tip.text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Need Help */}
                    <div className="bg-emerald-50 rounded-[24px] p-6 border border-emerald-100/50">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold font-heading text-gray-900 mb-2">Need Help?</h3>
                        <p className="text-sm text-gray-600 mb-5 leading-relaxed">Check our guide on how to record the best development videos for accurate AI analysis.</p>
                        <button
                            onClick={() => navigate('/improve-domain?domain=motor')}
                            className="w-full bg-emerald-500 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-600 transition shadow-sm"
                        >
                            View Guide
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
