'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Campus } from '@/lib/models';
import { geocodeCity, Coordinates } from '@/lib/geocoding';
import { motion } from 'framer-motion';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapRoute {
  id: string;
  points: [number, number][]; // [lat, lng]
  title: string;
}

interface TripMapProps {
  trips: Trip[];
  campuses: Campus[];
}

// Component to handle auto-fitting the map to show all points
function MapAutoBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [points, map]);
  return null;
}

export default function TripMap({ trips, campuses }: TripMapProps) {
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCoords() {
      setIsLoading(true);
      const newRoutes: MapRoute[] = [];

      for (const trip of trips) {
        if (trip.status === 'draft') continue; // Don't show drafts on global map

        const points: [number, number][] = [];
        
        // 1. Origin
        const originCoords = await geocodeCity(trip.originCity);
        if (originCoords) points.push([originCoords.lat, originCoords.lng]);

        // 2. Itinerary Points
        for (const item of trip.itinerary) {
          const campus = campuses.find(c => c.id === item.campusId);
          if (campus) {
            const coords = await geocodeCity(campus.city, campus.state);
            if (coords) points.push([coords.lat, coords.lng]);
          }
        }

        if (points.length >= 2) {
          newRoutes.push({
            id: trip.id,
            points,
            title: trip.title
          });
        }
      }

      setRoutes(newRoutes);
      setIsLoading(false);
    }

    if (trips.length > 0) {
      loadCoords();
    } else {
      setIsLoading(false);
    }
  }, [trips, campuses]);

  // All unique marker points
  const allPoints = useMemo(() => {
    const flat: [number, number][] = [];
    routes.forEach(r => r.points.forEach(p => flat.push(p)));
    // De-duplicate effectively
    return Array.from(new Set(flat.map(p => JSON.stringify(p)))).map(p => JSON.parse(p));
  }, [routes]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] rounded-[2rem] bg-muted/20 animate-pulse flex items-center justify-center border border-white/5 overflow-hidden relative">
        <div className="text-muted-foreground font-medium">Carregando mapa logístico...</div>
      </div>
    );
  }

  if (routes.length === 0) return null;

  return (
    <div className="w-full h-[450px] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative group">
      <div className="absolute top-6 left-6 z-[1000] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        Logística em Tempo Real
      </div>

      <MapContainer 
        center={[-12.9714, -38.5014]} 
        zoom={5} 
        style={{ height: '100%', width: '100%', filter: 'grayscale(0.8) invert(0.9) hue-rotate(180deg) brightness(0.9)' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routes.map(route => (
          <Polyline 
            key={route.id}
            positions={route.points}
            pathOptions={{ 
              color: '#9333ea', 
              weight: 3, 
              opacity: 0.6,
              dashArray: '10, 10',
              lineCap: 'round'
            }}
          >
            <Popup>
              <div className="text-sm font-bold">{route.title}</div>
            </Popup>
          </Polyline>
        ))}

        {allPoints.map((p, idx) => (
          <Marker key={idx} position={p}>
             <Popup>
               <div className="text-xs font-medium uppercase tracking-tighter">Ponto de Parada</div>
             </Popup>
          </Marker>
        ))}

        <MapAutoBounds points={allPoints as [number, number][]} />
      </MapContainer>
      
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  );
}
