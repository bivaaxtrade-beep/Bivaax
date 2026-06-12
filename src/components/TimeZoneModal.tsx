import React, { useState, useMemo } from 'react';
import { Search, X, Clock, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeZone: string;
  onSelect: (tz: string) => void;
}

export const TimeZoneModal: React.FC<TimeZoneModalProps> = ({ isOpen, onClose, selectedTimeZone, onSelect }) => {
  const [search, setSearch] = useState('');

  const timeZones = useMemo(() => {
    const zones = typeof Intl.supportedValuesOf === 'function' 
      ? Intl.supportedValuesOf('timeZone') 
      : ["UTC", "Asia/Dhaka", "America/New_York", "Europe/London", "America/Los_Angeles", "Europe/Paris", "Asia/Tokyo"];
    
    return zones.map(tz => {
      const now = new Date();
      let timeStr = "";
      let offset = "";
      try {
        timeStr = now.toLocaleTimeString("en-US", { 
          timeZone: tz, 
          hour: "2-digit", 
          minute: "2-digit", 
          hour12: true 
        });
        offset = now.toLocaleTimeString("en-US", { 
          timeZone: tz, 
          timeZoneName: "short" 
        }).split(' ').pop() || "";
      } catch (e) {
        timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        offset = "UTC";
      }

      return {
        id: tz,
        label: tz.replace(/_/g, ' '),
        region: tz.split('/')[0],
        time: timeStr,
        offset: offset
      };
    });
  }, []);

  const filteredZones = useMemo(() => {
    if (!search) return timeZones;
    const s = search.toLowerCase();
    return timeZones.filter(tz => 
      tz.label.toLowerCase().includes(s) || 
      tz.id.toLowerCase().includes(s)
    );
  }, [search, timeZones]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1b1e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#1a1b1e]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe size={20} className="text-blue-400" />
                  Select Time Zone
                </h3>
                <p className="text-xs text-gray-400 mt-1">Current selection: {selectedTimeZone.replace(/_/g, ' ')}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 bg-[#1a1b1e] border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  placeholder="Search by city or country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[#1a1b1e]">
              {filteredZones.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} />
                  </div>
                  <p className="font-bold">No results found</p>
                  <p className="text-sm">Try searching for a different city</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {filteredZones.map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        onSelect(tz.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                        selectedTimeZone === tz.id 
                          ? 'bg-blue-600/10 border border-blue-500/20' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedTimeZone === tz.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                        }`}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className={`font-bold text-[15px] ${selectedTimeZone === tz.id ? 'text-blue-400' : 'text-gray-200'}`}>
                            {tz.label}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">{tz.region} • {tz.offset}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className={`text-sm font-black ${selectedTimeZone === tz.id ? 'text-blue-400' : 'text-white'}`}>
                          {tz.time}
                        </p>
                        {selectedTimeZone === tz.id && (
                          <div className="bg-blue-600 rounded-full p-0.5">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
