import { motion } from 'framer-motion';
import { Tag, TAG_LABELS } from '../types';
import { Tag as TagIcon, TrendingUp, AlertTriangle, Star, Wrench, Expand, Clock, MessageSquare, GraduationCap } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

const tagConfig: Record<Tag, { icon: React.ReactNode; color: string }> = {
  'upsell-opportunity': { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'at-risk': { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-coral-500/20 text-coral-400 border-coral-500/30' },
  'champion-identified': { icon: <Star className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'technical-issues': { icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  'expansion-potential': { icon: <Expand className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'renewal-concern': { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  'product-feedback': { icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'training-needed': { icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const toggleTag = (tag: Tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-violet-500/20">
          <TagIcon className="w-5 h-5 text-violet-400" />
        </div>
        <h3 className="text-lg font-display font-semibold text-white">Tags</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAG_LABELS) as Tag[]).map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const config = tagConfig[tag];
          
          return (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleTag(tag)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                isSelected
                  ? config.color
                  : 'bg-midnight-700/50 text-gray-500 border-midnight-600 hover:text-gray-300 hover:border-midnight-500'
              }`}
            >
              {config.icon}
              {TAG_LABELS[tag]}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

