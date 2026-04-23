import React from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'मराठी', flag: '🇮🇳' },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'తెలుగు', flag: '🇮🇳' },
];

interface LanguagePickerProps {
  value: string;
  onChange: (code: string) => void;
  dark?: boolean; // true = white text (for dark story reader bg), false = dark text
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ value, onChange, dark = false }) => {
  return (
    <div className="relative flex items-center gap-1">
      <Globe className={`w-4 h-4 ${dark ? 'text-white/70' : 'text-gray-500'}`} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`text-sm font-medium rounded-lg px-2 py-1 border-0 outline-none cursor-pointer appearance-none pr-5
          ${dark
            ? 'bg-white/10 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        style={{ backgroundImage: 'none' }}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code} className="bg-white text-gray-800">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export { LANGUAGES };
export default LanguagePicker;
