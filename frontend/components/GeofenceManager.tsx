'use client';

import { useState, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { Geofence, GeofenceCreateInput } from '@/types/vehicle';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GeofenceFormData {
  name: string;
  description: string;
  color: string;
}

interface GeofenceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onGeofencesChange: (geofences: Geofence[]) => void;
  pendingCoordinates?: [number, number][] | null;
  onCoordinatesUsed: () => void;
  map: LeafletMap | null;
  selectedGeofenceId?: number | null;
  onGeofenceSelect: (id: number | null) => void;
}

export default function GeofenceManager({
  isOpen,
  onClose,
  onGeofencesChange,
  pendingCoordinates,
  onCoordinatesUsed,
  map,
  selectedGeofenceId,
  onGeofenceSelect,
}: GeofenceManagerProps) {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GeofenceFormData>({
    name: '',
    description: '',
    color: '#2563eb',
  });

  // Load geofences
  const loadGeofences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/geofences`);
      if (!response.ok) throw new Error('Failed to load geofences');
      const data = await response.json();
      setGeofences(data);
      onGeofencesChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load geofences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGeofences();
    }
  }, [isOpen]);

  // Show form when coordinates are drawn
  useEffect(() => {
    if (pendingCoordinates && pendingCoordinates.length > 0) {
      setShowForm(true);
    }
  }, [pendingCoordinates]);

  const handleSaveGeofence = async () => {
    if (!pendingCoordinates || pendingCoordinates.length < 3) {
      setError('Please draw a geofence on the map first (at least 3 points)');
      return;
    }

    if (!formData.name.trim()) {
      setError('Geofence name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const geofenceData: GeofenceCreateInput = {
        name: formData.name,
        description: formData.description || undefined,
        coordinates: pendingCoordinates,
        color: formData.color,
      };

      const response = await fetch(`${API_BASE_URL}/api/geofences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geofenceData),
      });

      if (!response.ok) throw new Error('Failed to save geofence');

      const savedGeofence = await response.json();
      const updatedGeofences = [...geofences, savedGeofence];
      setGeofences(updatedGeofences);
      onGeofencesChange(updatedGeofences);

      // Reset form
      setFormData({ name: '', description: '', color: '#2563eb' });
      setShowForm(false);
      onCoordinatesUsed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeofence = async (id: number) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/geofences/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete geofence');

      const updatedGeofences = geofences.filter((g) => g.id !== id);
      setGeofences(updatedGeofences);
      onGeofencesChange(updatedGeofences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleGotoGeofence = (geofence: Geofence) => {
    if (!map || !geofence.coordinates || geofence.coordinates.length === 0) return;

    // Calculate bounds from coordinates
    const bounds = geofence.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[1000] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Geofence Manager</h2>
          <p className="text-sm text-blue-100">{geofences.length} geofences</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-200 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && pendingCoordinates && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-3">New Geofence</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Warehouse Zone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveGeofence}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Save Geofence'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    onCoordinatesUsed();
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">How to create a geofence:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Click the polygon tool on the map (top right)</li>
              <li>Draw your geofence by clicking points on the map</li>
              <li>Complete the polygon by clicking the first point again</li>
              <li>Fill in the details and save</li>
            </ol>
          </div>
        )}

        {/* Geofence List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 mb-2">Existing Geofences</h3>
          {loading && geofences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading geofences...</div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No geofences yet. Draw one to get started!</div>
          ) : (
            geofences.map((geofence) => {
              const isSelected = geofence.id === selectedGeofenceId;
              return (
              <div
                key={geofence.id}
                onClick={() => onGeofenceSelect(isSelected ? null : geofence.id)}
                className={`border rounded-lg p-3 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: geofence.color || '#2563eb' }}
                      />
                      <h4 className="font-semibold text-gray-900">{geofence.name}</h4>
                      {isSelected && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    {geofence.description && (
                      <p className="text-sm text-gray-600 mt-1">{geofence.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {geofence.coordinates.length} points
                    </p>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">Created:</span>{' '}
                          {geofence.created_at ? new Date(geofence.created_at).toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">ID:</span> {geofence.id}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleGotoGeofence(geofence)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Go to geofence"
                      title="Pan to geofence on map"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGeofence(geofence.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete geofence"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
}
