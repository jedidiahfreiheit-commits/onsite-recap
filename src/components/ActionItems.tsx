import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionItem } from '../types';
import { generateId } from '../services/storage';

interface ActionItemsProps {
  items: ActionItem[];
  onUpdate: (items: ActionItem[]) => void;
}

export function ActionItems({ items, onUpdate }: ActionItemsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    description: '',
    owner: '',
    dueDate: '',
  });

  const handleAddItem = () => {
    if (!newItem.description) return;
    
    const item: ActionItem = {
      id: generateId(),
      description: newItem.description,
      owner: newItem.owner,
      dueDate: newItem.dueDate,
      completed: false,
    };
    
    onUpdate([...items, item]);
    setNewItem({ description: '', owner: '', dueDate: '' });
    setIsAdding(false);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(items.filter(i => i.id !== id));
  };

  const toggleComplete = (id: string) => {
    onUpdate(items.map(i => 
      i.id === id ? { ...i, completed: !i.completed } : i
    ));
  };

  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sage-500/20">
            <ListTodo className="w-5 h-5 text-sage-400" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-white">Action Items</h3>
            {items.length > 0 && (
              <p className="text-sm text-gray-500">
                {completedCount} of {items.length} completed
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-midnight-700 hover:bg-midnight-600 rounded-lg transition-colors text-gray-300 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / items.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-sage-500 to-sage-400 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                item.completed 
                  ? 'bg-midnight-700/30 border-midnight-700' 
                  : 'bg-midnight-700/50 border-midnight-600'
              }`}
            >
              <button
                onClick={() => toggleComplete(item.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-sage-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-500 hover:text-sage-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {item.owner && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <User className="w-3.5 h-3.5" />
                      {item.owner}
                    </div>
                  )}
                  {item.dueDate && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-1.5 text-gray-500 hover:text-coral-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && !isAdding && (
          <p className="text-center text-gray-500 py-8">
            No action items yet. Click "Add Item" to create tasks with owners and due dates.
          </p>
        )}
      </div>

      {/* Add item form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-midnight-700/30 rounded-xl border border-midnight-600"
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Description *"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Owner"
                  value={newItem.owner}
                  onChange={(e) => setNewItem({ ...newItem, owner: e.target.value })}
                  className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
                />
                <input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                  className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 text-sm bg-shiphero-red hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Add Item
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

