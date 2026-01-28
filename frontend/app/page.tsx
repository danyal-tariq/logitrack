'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Map as LeafletMap } from 'leaflet';
import { useVehicleSocket } from '@/hooks/useVehicleSocket';
import { useVehicleMarkers } from '@/hooks/useVehicleMarkers';
import { useGeofenceDrawing } from '@/hooks/useGeofenceDrawing';
import { Geofence } from '@/types/vehicle';
import FleetStats from '@/components/FleetStats';
import VehicleList from '@/components/VehicleList';
import VehicleDetails from '@/components/VehicleDetails';
import GeofenceManager from '@/components/GeofenceManager';
import GeofenceDetails from '@/components/GeofenceDetails';

// Dynamic import to prevent SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [geofenceManagerOpen, setGeofenceManagerOpen] = useState(false);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [pendingCoordinates, setPendingCoordinates] = useState<[number, number][] | null>(null);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<number | null>(null);

  const { isConnected, error, lastUpdate } = useVehicleSocket({
    url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
  });

  const handleMarkerClick = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setIsFollowing(false);
  }, []);

  const { updateVehicle, vehicles, stats, centerOnVehicle } = useVehicleMarkers({
    map,
    selectedVehicleId,
    isFollowing,
    onMarkerClick: handleMarkerClick,
  });

  // Geofence drawing
  useGeofenceDrawing({
    map,
    onGeofenceCreated: (coordinates) => {
      setPendingCoordinates(coordinates);
      setGeofenceManagerOpen(true);
    },
    onGeofenceClick: (geofenceId) => {
      setSelectedGeofenceId(geofenceId);
      setSelectedVehicleId(null); // Close vehicle details if open
    },
    existingGeofences: geofences.map(g => ({
      id: g.id,
      coordinates: g.coordinates,
      color: g.color,
    })),
  });

  // Load geofences on mount
  useEffect(() => {
    const loadGeofences = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/geofences`);
        if (response.ok) {
          const data = await response.json();
          setGeofences(data);
        }
      } catch (err) {
        console.error('Failed to load geofences:', err);
      }
    };
    loadGeofences();
  }, []);

  // Update vehicle markers when new location data arrives
  useEffect(() => {
    if (lastUpdate) {
      updateVehicle(lastUpdate);
    }
  }, [lastUpdate, updateVehicle]);

  const handleSelectVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId === selectedVehicleId ? null : vehicleId);
    setIsFollowing(false);
  }, [selectedVehicleId]);

  const handleCenterVehicle = useCallback((vehicleId: string) => {
    centerOnVehicle(vehicleId);
    setSelectedVehicleId(vehicleId);
  }, [centerOnVehicle]);

  const handleFollow = useCallback(() => {
    setIsFollowing(!isFollowing);
  }, [isFollowing]);

  const handleCloseDetails = useCallback(() => {
    setSelectedVehicleId(null);
    setIsFollowing(false);
  }, []);

  const handleDeleteGeofence = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/geofences/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedGeofences = geofences.filter(g => g.id !== id);
        setGeofences(updatedGeofences);
      }
    } catch (err) {
      console.error('Failed to delete geofence:', err);
    }
  };

  const handleGotoGeofence = (geofence: Geofence) => {
    if (!map || !geofence.coordinates || geofence.coordinates.length === 0) return;
    const bounds = geofence.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
  };

  const selectedVehicle = selectedVehicleId ? vehicles.get(selectedVehicleId) || null : null;
  const selectedGeofence = selectedGeofenceId ? geofences.find(g => g.id === selectedGeofenceId) || null : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100">
      {/* Map */}
      <Map onMapReady={setMap} className="absolute inset-0 z-0" />

      {/* Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white rounded-full shadow-lg px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-6 h-6 fill-blue-500">
              <path d="M32 160C32 124.7 60.7 96 96 96L384 96C419.3 96 448 124.7 448 160L448 192L498.7 192C515.7 192 532 198.7 544 210.7L589.3 256C601.3 268 608 284.3 608 301.3L608 448C608 483.3 579.3 512 544 512L540.7 512C530.3 548.9 496.3 576 456 576C415.7 576 381.8 548.9 371.3 512L268.7 512C258.3 548.9 224.3 576 184 576C143.7 576 109.8 548.9 99.3 512L96 512C60.7 512 32 483.3 32 448L32 160zM544 352L544 301.3L498.7 256L448 256L448 352L544 352zM224 488C224 465.9 206.1 448 184 448C161.9 448 144 465.9 144 488C144 510.1 161.9 528 184 528C206.1 528 224 510.1 224 488zM456 528C478.1 528 496 510.1 496 488C496 465.9 478.1 448 456 448C433.9 448 416 465.9 416 488C416 510.1 433.9 528 456 528z" />
            </svg>
            <span className="font-bold text-gray-800 text-lg">Logitrack</span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {stats.total > 0 && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{stats.total}</span> vehicles
              </span>
            </>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {sidebarOpen ? (
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
        </button>

        {/* Geofence Manager Button */}
        <button
          onClick={() => setGeofenceManagerOpen(!geofenceManagerOpen)}
          className={`rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors ${
            geofenceManagerOpen ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'
          }`}
          title="Geofence Manager"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          </svg>
        </button>
      </div>

      {/* Left Sidebar */}
      <div
        className={`absolute top-24 left-4 bottom-4 w-80 z-10 flex flex-col gap-4 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
        }`}
      >
        {/* Fleet Stats */}
        <FleetStats stats={stats} isConnected={isConnected} />

        {/* Vehicle List */}
        <div className="flex-1 min-h-0">
          <VehicleList
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={handleSelectVehicle}
            onCenterVehicle={handleCenterVehicle}
          />
        </div>
      </div>

      {/* Right Panel - Vehicle Details */}
      {selectedVehicle && (
        <div className="absolute top-16 right-4 w-80 z-10">
          <VehicleDetails
            vehicle={selectedVehicle}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onClose={handleCloseDetails}
          />
        </div>
      )}

      {/* Right Panel - Geofence Details */}
      {selectedGeofence && !selectedVehicle && (
        <div className="absolute top-16 right-4 w-80 z-10">
          <GeofenceDetails
            geofence={selectedGeofence}
            onClose={() => setSelectedGeofenceId(null)}
            onDelete={handleDeleteGeofence}
            onGoto={handleGotoGeofence}
            map={map}
          />
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Map Controls Hint */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>🖱️ Click marker to select</span>
            <span>📍 Double-click list to center</span>
          </div>
        </div>
      </div>

      {/* Geofence Manager */}
      <GeofenceManager
        isOpen={geofenceManagerOpen}
        onClose={() => {
          setGeofenceManagerOpen(false);
        }}
        onGeofencesChange={setGeofences}
        pendingCoordinates={pendingCoordinates}
        onCoordinatesUsed={() => setPendingCoordinates(null)}
        map={map}
        selectedGeofenceId={null}
        onGeofenceSelect={() => {}}
      />
    </div>
  );
}
