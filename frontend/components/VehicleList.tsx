'use client';

import { TrackedVehicle, VehicleStatus } from '@/types/vehicle';

interface VehicleListProps {
  vehicles: Map<string, TrackedVehicle>;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onCenterVehicle: (vehicleId: string) => void;
}

const statusConfig: Record<VehicleStatus, { color: string; bg: string; label: string }> = {
  moving: { color: 'text-green-700', bg: 'bg-green-100', label: 'Moving' },
  idling: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Idling' },
  stopped: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Stopped' },
};

function getSpeedColor(speed: number): string {
  if (speed >= 80) return 'text-green-600';
  if (speed >= 40) return 'text-blue-600';
  if (speed > 0) return 'text-amber-600';
  return 'text-gray-400';
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onCenterVehicle,
}: VehicleListProps) {
  const vehicleArray = Array.from(vehicles.values()).sort((a, b) => {
    // Sort: moving first, then by speed descending
    if (a.status !== b.status) {
      const order: Record<VehicleStatus, number> = { moving: 0, idling: 1, stopped: 2 };
      return order[a.status] - order[b.status];
    }
    return b.speed - a.speed;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Vehicles</h2>
        <p className="text-xs text-gray-500 mt-1">
          Click to select • Double-click to center
        </p>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {vehicleArray.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No vehicles tracked yet
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {vehicleArray.map((vehicle) => {
              const isSelected = vehicle.id === selectedVehicleId;
              const config = statusConfig[vehicle.status];

              return (
                <div
                  key={vehicle.id}
                  onClick={() => onSelectVehicle(vehicle.id)}
                  onDoubleClick={() => onCenterVehicle(vehicle.id)}
                  className={`p-3 cursor-pointer transition-all duration-150 hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Vehicle Info */}
                    <div className="flex items-center gap-3">
                      {/* Vehicle Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className={`w-5 h-5 ${isSelected ? 'fill-white' : 'fill-gray-500'}`}
                        >
                          <path d="M32 160C32 124.7 60.7 96 96 96L384 96C419.3 96 448 124.7 448 160L448 192L498.7 192C515.7 192 532 198.7 544 210.7L589.3 256C601.3 268 608 284.3 608 301.3L608 448C608 483.3 579.3 512 544 512L540.7 512C530.3 548.9 496.3 576 456 576C415.7 576 381.8 548.9 371.3 512L268.7 512C258.3 548.9 224.3 576 184 576C143.7 576 109.8 548.9 99.3 512L96 512C60.7 512 32 483.3 32 448L32 160zM544 352L544 301.3L498.7 256L448 256L448 352L544 352zM224 488C224 465.9 206.1 448 184 448C161.9 448 144 465.9 144 488C144 510.1 161.9 528 184 528C206.1 528 224 510.1 224 488zM456 528C478.1 528 496 510.1 496 488C496 465.9 478.1 448 456 448C433.9 448 416 465.9 416 488C416 510.1 433.9 528 456 528z" />
                        </svg>
                      </div>

                      {/* Vehicle Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            Vehicle {vehicle.id}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTime(vehicle.lastUpdate)}
                        </div>
                      </div>
                    </div>

                    {/* Speed & Heading */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getSpeedColor(vehicle.speed)}`}>
                        {vehicle.speed.toFixed(0)}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">km/h</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3 h-3"
                          style={{ transform: `rotate(${vehicle.heading}deg)` }}
                        >
                          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                        </svg>
                        {vehicle.heading}°
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
