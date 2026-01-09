import { CalendarClock } from 'lucide-react';

interface FollowUpReminderProps {
  date: string;
  notes: string;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
}

export function FollowUpReminder({ date, notes, onDateChange, onNotesChange }: FollowUpReminderProps) {
  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-sky-500/20">
          <CalendarClock className="w-5 h-5 text-sky-400" />
        </div>
        <h3 className="text-lg font-display font-semibold text-white">Follow-up Reminder</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-2">
            FOLLOW-UP DATE
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-3 bg-midnight-700 border border-midnight-600 rounded-xl text-white focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-2">
            REMINDER NOTES
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="What should you remember for the follow-up?"
            rows={3}
            className="w-full px-4 py-3 bg-midnight-700 border border-midnight-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

