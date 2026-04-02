'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  author: string;
  timestamp: string;
  duration: number; // Added duration
}

export const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { addSong } = useStore();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced Search
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Failed to search:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (video: SearchResult) => {
    addSong(video.videoId, video.title, video.duration);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search YouTube to add a song..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-10 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" size={18} />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] flex flex-col">
          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-2">
            {results.length === 0 && !isSearching ? (
              <p className="text-gray-500 text-center py-4 text-sm">No results found.</p>
            ) : (
              results.map((video) => (
                <div key={video.videoId} className="flex gap-3 items-center p-2 rounded-lg hover:bg-gray-800 transition-colors group">
                  <div className="relative w-24 h-16 flex-shrink-0 bg-black rounded overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                      {video.timestamp}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white line-clamp-2 leading-tight">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {video.author}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleAdd(video)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-950 border border-gray-700 flex items-center justify-center text-gray-300 hover:text-cyan-400 hover:border-cyan-400 transition-colors"
                    title="Add to queue"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};