export type VehicleStatus = 'moving' | 'idling' | 'stopped';

export interface Vehicle {
  id: string;
  license_plate: string;
  driver_name?: string;
  model?: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_location?: {
    lat: number;
    lng: number;
  };
  last_updated?: Date;
}

export interface LocationUpdate {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status?: VehicleStatus;
  recorded_at: string;
}

export interface TrackedVehicle {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: VehicleStatus;
  lastUpdate: number;
  route?: string;
}

export interface FleetStats {
  total: number;
  moving: number;
  idling: number;
  stopped: number;
  avgSpeed: number;
  maxSpeed: number;
}

export interface Geofence {
  id: number;
  name: string;
  description?: string;
  coordinates: [number, number][];
  color?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface GeofenceCreateInput {
  name: string;
  description?: string;
  coordinates: [number, number][];
  color?: string;
}

export interface GeofenceUpdateInput {
  name?: string;
  description?: string;
  coordinates?: [number, number][];
  color?: string;
}
