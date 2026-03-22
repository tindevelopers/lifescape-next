'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Menu, Plus, X } from 'lucide-react';

interface NavbarProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({ onMenuToggle, isSidebarOpen }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4 mx-auto max-w-screen-2xl">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-indigo-600 tracking-tight">
              Lifescape
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden sm:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search moments, people, channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors sm:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* User avatar */}
          <button
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
            aria-label="User menu"
          >
            LT
          </button>

          {/* Post Moment button */}
          <Link
            href="/moments/new"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post Moment</span>
          </Link>

          {/* Mobile post button */}
          <Link
            href="/moments/new"
            className="flex sm:hidden items-center justify-center w-9 h-9 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            aria-label="Post Moment"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
