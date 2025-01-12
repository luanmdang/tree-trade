import React, { useState } from 'react';
import { X, Key } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface AdminKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminKeyModal({ isOpen, onClose }: AdminKeyModalProps) {
  const [key, setKey] = useState('');
  const { setAdminKey } = useAdmin();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(key);
    setKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">
              Enter Admin Key
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-6 h-6 dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter admin key"
                />
                <Key className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}