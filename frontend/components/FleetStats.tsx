'use client';

import { FleetStats as FleetStatsType } from '@/types/vehicle';

interface FleetStatsProps {
  stats: FleetStatsType;
  isConnected: boolean;
}

export default function FleetStats({ stats, isConnected }: FleetStatsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Fleet Overview</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Total Vehicles */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-blue-100">Total Vehicles</div>
        </div>

        {/* Average Speed */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-3 text-white">
          <div className="text-2xl font-bold">{stats.avgSpeed.toFixed(0)}</div>
          <div className="text-xs text-emerald-100">Avg Speed (km/h)</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Status Breakdown
        </h3>
        
        {/* Moving */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{stats.moving}</span>
            <span className="text-xs text-gray-400">
              ({stats.total > 0 ? ((stats.moving / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Idling */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-600">Idling</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{stats.idling}</span>
            <span className="text-xs text-gray-400">
              ({stats.total > 0 ? ((stats.idling / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Stopped */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">Stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{stats.stopped}</span>
            <span className="text-xs text-gray-400">
              ({stats.total > 0 ? ((stats.stopped / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
        {stats.total > 0 && (
          <>
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(stats.moving / stats.total) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all duration-300"
              style={{ width: `${(stats.idling / stats.total) * 100}%` }}
            />
            <div
              className="bg-gray-400 transition-all duration-300"
              style={{ width: `${(stats.stopped / stats.total) * 100}%` }}
            />
          </>
        )}
      </div>

      {/* Max Speed */}
      {stats.maxSpeed > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Top Speed</span>
            <span className="font-semibold text-gray-700">{stats.maxSpeed.toFixed(0)} km/h</span>
          </div>
        </div>
      )}
    </div>
  );
}
