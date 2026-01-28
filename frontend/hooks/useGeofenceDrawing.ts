'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Map as LeafletMap } from 'leaflet';

let L: typeof import('leaflet') | null = null;
let drawLoaded = false;

interface UseGeofenceDrawingOptions {
  map: LeafletMap | null;
  onGeofenceCreated?: (coordinates: [number, number][]) => void;
  onGeofenceEdited?: (coordinates: [number, number][]) => void;
  onGeofenceClick?: (geofenceId: number) => void;
  existingGeofences?: Array<{ id: number; coordinates: [number, number][]; color?: string }>;
}

export function useGeofenceDrawing({
  map,
  onGeofenceCreated,
  onGeofenceEdited,
  onGeofenceClick,
  existingGeofences = [],
}: UseGeofenceDrawingOptions) {
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const geofenceLayersRef = useRef<Map<number, any>>(new Map());
  const isInitializedRef = useRef(false);

  const handleCreated = useCallback((e: any) => {
    const layer = e.layer;
    if (drawnItemsRef.current) {
      drawnItemsRef.current.addLayer(layer);
    }

    // Handle both polygon and rectangle
    let latlngs;
    if (layer.getLatLngs) {
      latlngs = layer.getLatLngs();
      console.log('Raw getLatLngs:', JSON.stringify(latlngs));
      // Polygons have nested arrays, rectangles don't
      if (Array.isArray(latlngs[0]) && latlngs[0].length > 0 && typeof latlngs[0][0].lat === 'number') {
        latlngs = latlngs[0];
      }
    }

    if (latlngs && onGeofenceCreated) {
      const coordinates: [number, number][] = latlngs.map((latlng: any) => [
        latlng.lat,
        latlng.lng,
      ]);
      console.log('Coordinates to save (should be [lat, lng]):', JSON.stringify(coordinates));
      console.log('First point - lat:', coordinates[0][0], 'lng:', coordinates[0][1]);
      console.log('Dubai should be approximately: lat ~25, lng ~55');
      onGeofenceCreated(coordinates);
    }
  }, [onGeofenceCreated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !map || isInitializedRef.current) return;

    const initializeDrawing = async () => {
      try {
        if (!L) {
          L = (await import('leaflet')).default as any;
        }
        if (!drawLoaded) {
          await import('leaflet-draw');
          drawLoaded = true;
        }

        // Small delay to ensure L.Control.Draw is available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!L || !(L as any).Control?.Draw) {
          console.error('Leaflet.Draw not loaded properly');
          return;
        }

        // Create feature group for drawn items
        if (!drawnItemsRef.current) {
          drawnItemsRef.current = new (L as any).FeatureGroup();
          map.addLayer(drawnItemsRef.current);
        }

        // Add draw control
        if (!drawControlRef.current) {
          drawControlRef.current = new (L as any).Control.Draw({
            position: 'topright',
            draw: {
              polygon: {
                allowIntersection: false,
                showArea: true,
                drawError: {
                  color: '#ef4444',
                  timeout: 1000,
                },
                shapeOptions: {
                  color: '#2563eb',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.2,
                },
              },
              polyline: false,
              rectangle: {
                shapeOptions: {
                  color: '#2563eb',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.2,
                },
              },
              circle: false,
              marker: false,
              circlemarker: false,
            },
            edit: {
              featureGroup: drawnItemsRef.current,
              remove: true,
            },
          });
          map.addControl(drawControlRef.current);
          isInitializedRef.current = true;
        }

        // Handle polygon creation
        map.on(((L as any).Draw as any).Event.CREATED, handleCreated);

      } catch (err) {
        console.error('Error initializing geofence drawing:', err);
      }
    };

    initializeDrawing();

    return () => {
      if (map) {
        map.off('draw:created');
        map.off('draw:edited');
        map.off('draw:deleted');
      }
    };
  }, [map, handleCreated]);

  // Load existing geofences
  useEffect(() => {
    if (!map) return;

    const loadGeofences = async () => {
      // Ensure Leaflet is loaded
      if (!L) {
        L = (await import('leaflet')).default as any;
      }

      // Clear existing geofence layers
      geofenceLayersRef.current.forEach((layer) => {
        map.removeLayer(layer);
      });
      geofenceLayersRef.current.clear();

      // Add geofences to map
      existingGeofences.forEach((geofence) => {
        if (!geofence.coordinates || geofence.coordinates.length === 0) {
          console.warn('Geofence has no coordinates:', geofence);
          return;
        }

        const latlngs = geofence.coordinates.map(([lat, lng]) => [lat, lng]);
        const polygon = (L as any).polygon(latlngs, {
          color: geofence.color || '#2563eb',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.2,
        });

        // Add click handler
        if (onGeofenceClick) {
          polygon.on('click', (e: any) => {
            (L as any).DomEvent.stopPropagation(e);
            onGeofenceClick(geofence.id);
          });
        }

        polygon.addTo(map);
        geofenceLayersRef.current.set(geofence.id, polygon);
      });
    };

    loadGeofences();
  }, [map, existingGeofences]);

  const clearDrawing = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
  };

  const removeGeofence = (id: number) => {
    const layer = geofenceLayersRef.current.get(id);
    if (layer && map) {
      map.removeLayer(layer);
      geofenceLayersRef.current.delete(id);
    }
  };

  return {
    clearDrawing,
    removeGeofence,
  };
}
