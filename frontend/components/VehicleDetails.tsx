'use client';

import { TrackedVehicle, VehicleStatus } from '@/types/vehicle';

interface VehicleDetailsProps {
  vehicle: TrackedVehicle | null;
  isFollowing: boolean;
  onFollow: () => void;
  onClose: () => void;
}

const statusConfig: Record<VehicleStatus, { color: string; bg: string; label: string }> = {
  moving: { color: 'text-green-700', bg: 'bg-green-100', label: 'Moving' },
  idling: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Idling' },
  stopped: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Stopped' },
};

export default function VehicleDetails({
  vehicle,
  isFollowing,
  onFollow,
  onClose,
}: VehicleDetailsProps) {
  if (!vehicle) return null;

  const config = statusConfig[vehicle.status];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="w-7 h-7 fill-white"
              >
                <path d="M32 160C32 124.7 60.7 96 96 96L384 96C419.3 96 448 124.7 448 160L448 192L498.7 192C515.7 192 532 198.7 544 210.7L589.3 256C601.3 268 608 284.3 608 301.3L608 448C608 483.3 579.3 512 544 512L540.7 512C530.3 548.9 496.3 576 456 576C415.7 576 381.8 548.9 371.3 512L268.7 512C258.3 548.9 224.3 576 184 576C143.7 576 109.8 548.9 99.3 512L96 512C60.7 512 32 483.3 32 448L32 160zM544 352L544 301.3L498.7 256L448 256L448 352L544 352zM224 488C224 465.9 206.1 448 184 448C161.9 448 144 465.9 144 488C144 510.1 161.9 528 184 528C206.1 528 224 510.1 224 488zM456 528C478.1 528 496 510.1 496 488C496 465.9 478.1 448 456 448C433.9 448 416 465.9 416 488C416 510.1 433.9 528 456 528z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Vehicle {vehicle.id}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-white/20`}>
                {config.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* Speed */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-600">Speed</span>
          </div>
          <span className="text-xl font-bold text-gray-800">
            {vehicle.speed.toFixed(1)} <span className="text-sm font-normal text-gray-400">km/h</span>
          </span>
        </div>

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-emerald-600"
                style={{ transform: `rotate(${vehicle.heading}deg)` }}
              >
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Heading</span>
          </div>
          <span className="text-xl font-bold text-gray-800">
            {vehicle.heading}°
          </span>
        </div>

        {/* Coordinates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-600">Location</span>
          </div>
          <span className="text-sm font-mono text-gray-600">
            {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
          </span>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Last Update</span>
          <span className="text-xs text-gray-500">
            {new Date(vehicle.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0">
        <button
          onClick={onFollow}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isFollowing
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isFollowing ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Following
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Follow Vehicle
            </>
          )}
        </button>
      </div>
    </div>
  );
}
