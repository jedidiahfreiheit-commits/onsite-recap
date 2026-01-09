import { useState } from 'react';
import { Plus, Trash2, Star, User, Mail, Phone, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact } from '../types';
import { generateId } from '../services/storage';

interface ContactsSectionProps {
  contacts: Contact[];
  onUpdate: (contacts: Contact[]) => void;
}

export function ContactsSection({ contacts, onUpdate }: ContactsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    title: '',
    email: '',
    phone: '',
    isChampion: false,
  });

  const handleAddContact = () => {
    if (!newContact.name) return;
    
    const contact: Contact = {
      id: generateId(),
      name: newContact.name || '',
      title: newContact.title || '',
      email: newContact.email || '',
      phone: newContact.phone || '',
      isChampion: newContact.isChampion || false,
    };
    
    onUpdate([...contacts, contact]);
    setNewContact({ name: '', title: '', email: '', phone: '', isChampion: false });
    setIsAdding(false);
  };

  const handleRemoveContact = (id: string) => {
    onUpdate(contacts.filter(c => c.id !== id));
  };

  const toggleChampion = (id: string) => {
    onUpdate(contacts.map(c => 
      c.id === id ? { ...c, isChampion: !c.isChampion } : c
    ));
  };

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-display font-semibold text-white">Key Contacts Met</h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-midnight-700 hover:bg-midnight-600 rounded-lg transition-colors text-gray-300 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Contacts list */}
      <div className="space-y-3">
        <AnimatePresence>
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-4 bg-midnight-700/50 rounded-xl border border-midnight-600"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-white font-medium">{contact.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">{contact.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 text-sm">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 text-sm">{contact.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleChampion(contact.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    contact.isChampion 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-midnight-600 text-gray-500 hover:text-amber-400'
                  }`}
                  title={contact.isChampion ? 'Champion' : 'Mark as Champion'}
                >
                  <Star className={`w-4 h-4 ${contact.isChampion ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="p-2 text-gray-500 hover:text-coral-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {contacts.length === 0 && !isAdding && (
          <p className="text-center text-gray-500 py-8">
            No contacts added yet. Click "Add Contact" to add stakeholders you met.
          </p>
        )}
      </div>

      {/* Add contact form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-midnight-700/30 rounded-xl border border-midnight-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name *"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
              />
              <input
                type="text"
                placeholder="Title"
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="px-4 py-2 bg-midnight-700 border border-midnight-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newContact.isChampion}
                  onChange={(e) => setNewContact({ ...newContact, isChampion: e.target.checked })}
                  className="w-4 h-4 rounded border-midnight-600 bg-midnight-700 text-amber-500 focus:ring-amber-500/20"
                />
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-gray-400">Mark as Champion</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-4 py-2 text-sm bg-shiphero-red hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

