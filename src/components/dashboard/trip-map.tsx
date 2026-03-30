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
  points: { lat: number; lng: number; date: Date }[];
  title: string;
}

interface TripMapProps {
  trips: Trip[];
  campuses: Campus[];
  avatarUrl?: string | null;
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

export default function TripMap({ trips, campuses, avatarUrl }: TripMapProps) {
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCoords() {
      setIsLoading(true);
      const newRoutes: MapRoute[] = [];

      for (const trip of trips) {
        if (trip.status === 'draft') continue;

        interface MapStop {
            city: string;
            date: Date;
        }
        
        const stops: MapStop[] = [];
        
        // 1. Origin
        stops.push({
            city: trip.originCity,
            date: new Date(trip.startDate + 'T00:00:00')
        });

        // 2. Flights
        trip.plannedFlights?.forEach(f => {
            const flightDate = f.date || trip.startDate;
            const flightTime = f.flightTime || '00:00';
            stops.push({
                city: f.to,
                date: new Date(`${flightDate}T${flightTime}`)
            });
        });

        // 3. Itinerary
        for (const item of trip.itinerary) {
          const campus = campuses.find(c => c.id === item.campusId);
          if (campus) {
            const arrivalDate = item.plannedArrival ? new Date(item.plannedArrival) : new Date(trip.startDate);
            stops.push({
                city: campus.city,
                date: arrivalDate
            });
          }
        }

        const sortedStops = stops.sort((a, b) => a.date.getTime() - b.date.getTime());
        const points: {lat: number, lng: number, date: Date}[] = [];

        for (const stop of sortedStops) {
            const coords = await geocodeCity(stop.city);
            if (coords) {
                // Only push if different from last point
                if (points.length === 0 || 
                    points[points.length-1].lat !== coords.lat || 
                    points[points.length-1].lng !== coords.lng) {
                    points.push({ lat: coords.lat, lng: coords.lng, date: stop.date });
                }
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

  // Helper for local date/time parsing (robust)
  const parseLocal = (dateVal: any, timePart: string = '00:00') => {
    if (!dateVal) return new Date(NaN);
    if (dateVal instanceof Date) return dateVal;
    
    const dateStr = String(dateVal);
    if (dateStr.includes('T')) return new Date(dateStr);

    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    let y, m, d;
    
    if (dateStr.includes('-')) {
        [y, m, d] = parts.map(Number);
    } else {
        [d, m, y] = parts.map(Number);
    }

    const [hh, mm] = (timePart || '00:00').split(':').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(NaN);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  };

  // All unique marker points
  const allPoints: [number, number][] = useMemo(() => {
    const flat: [number, number][] = [];
    routes.forEach(r => r.points.forEach(p => flat.push([p.lat, p.lng])));
    // De-duplicate effectively
    return Array.from(new Set(flat.map(p => JSON.stringify(p)))).map((p: string) => JSON.parse(p));
  }, [routes]);

  // Determine current projected position for the primary trip
  const techMarker = useMemo(() => {
    if (trips.length === 0) return null;
    const trip = trips[0];
    const now = new Date();

    // 1. Real Events (Manual)
    const realEvents: { date: Date, city: string, status: string }[] = [];
    
    trip.legs.forEach(leg => {
      if (leg.date) {
        const d = parseLocal(leg.date, leg.time || '00:00');
        if (!isNaN(d.getTime())) realEvents.push({ date: d, city: leg.to, status: 'Em Viagem' });
      }
    });

    trip.visits.forEach(visit => {
      if (visit.sessions.length > 0) {
        const latestSession = [...visit.sessions].sort((a,b) => 
            new Date(b.startAt || 0).getTime() - new Date(a.startAt || 0).getTime()
        )[0];
        if (latestSession?.startAt) {
            const campus = campuses.find(c => c.id === visit.campusId);
            if (campus) {
                realEvents.push({ date: new Date(latestSession.startAt), city: campus.city, status: 'Em Atendimento' });
            }
        }
      }
    });

    // 2. Planned Events (Fallback)
    const plannedEvents: { date: Date, city: string, status: string }[] = [];
    
    trip.plannedFlights?.forEach(f => {
      const d = parseLocal(f.date || trip.startDate, f.flightTime || '00:00');
      if (!isNaN(d.getTime()) && d <= now) {
        plannedEvents.push({ date: d, city: f.to, status: 'Em Viagem' });
      }
    });

    trip.itinerary.forEach(item => {
      const campus = campuses.find(c => c.id === item.campusId);
      if (campus && item.plannedArrival) {
        const d = parseLocal(item.plannedArrival);
        if (!isNaN(d.getTime()) && d <= now) {
          plannedEvents.push({ date: d, city: campus.city, status: 'Em Viagem' });
        }
      }
    });

    // Sort by date desc
    const allEvents = [...realEvents, ...plannedEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let currentCity = trip.originCity;
    let currentStatus = 'Em Viagem';

    if (allEvents.length > 0) {
        currentCity = allEvents[0].city;
        currentStatus = allEvents[0].status;
    }

    return { city: currentCity, status: currentStatus };
  }, [trips, campuses]);

  // Load tech marker coordinates
  const [techCoords, setTechCoords] = useState<{lat: number, lng: number} | null>(null);
  useEffect(() => {
    if (techMarker) {
        geocodeCity(techMarker.city).then(coords => {
            if (coords) setTechCoords(coords);
        });
    }
  }, [techMarker]);

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
        style={{ height: '100%', width: '100%', background: '#0a0a0b' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {routes.map(route => {
          const segments = [];
          const now = new Date();

          for (let i = 0; i < route.points.length - 1; i++) {
             const start = route.points[i];
             const end = route.points[i+1];
             
             let status: 'past' | 'current' | 'future' = 'future';
             
             if (end.date <= now) {
                status = 'past';
             } else if (start.date <= now && end.date > now) {
                status = 'current';
             }

             segments.push({
                 path: [[start.lat, start.lng], [end.lat, end.lng]] as [number, number][],
                 status
             });
          }

          return segments.map((seg, idx) => (
             <Polyline 
                key={`${route.id}-seg-${idx}`}
                positions={seg.path}
                color={seg.status === 'past' ? '#10b981' : seg.status === 'current' ? '#3b82f6' : '#ffffff40'}
                weight={seg.status === 'current' ? 4 : 2}
                dashArray={seg.status !== 'past' ? '10, 10' : undefined}
                lineCap="round"
                className={seg.status === 'current' ? 'animate-dash' : ''}
             >
                {seg.status === 'current' && (
                  <Popup>
                    <div className="text-sm font-bold">{route.title}</div>
                  </Popup>
                )}
             </Polyline>
          ));
        })}

        {allPoints.map((p, idx) => (
          <Marker key={idx} position={p}>
             <Popup>
               <div className="text-xs font-medium uppercase tracking-tighter">Ponto de Parada</div>
             </Popup>
          </Marker>
        ))}

        {/* Current Tech Marker */}
        {techCoords && (
          <Marker 
            position={[techCoords.lat, techCoords.lng]}
            icon={L.divIcon({
              className: 'custom-tech-indicator',
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="absolute w-12 h-12 bg-${techMarker?.status === 'Em Atendimento' ? 'emerald' : 'blue'}-500/30 rounded-full animate-ping"></div>
                  <div class="w-10 h-10 rounded-full border-4 border-${techMarker?.status === 'Em Atendimento' ? 'emerald' : 'blue'}-500 overflow-hidden bg-[#0a0a0b] shadow-2xl z-10">
                    <div class="w-full h-full flex items-center justify-center bg-primary/10">
                         ${avatarUrl ? 
                           `<img src="${avatarUrl}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=Tecnico&background=3b82f6&color=fff'" />` :
                           `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-${techMarker?.status === 'Em Atendimento' ? 'emerald' : 'blue'}-500"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`
                         }
                    </div>
                  </div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })}
          >
            <Popup>
               <div className="text-xs font-black uppercase tracking-widest text-center">
                    Sua Posição Projetada<br/>
                    <span className="text-[10px] text-muted-foreground font-bold">Baseado no Roteiro</span>
               </div>
            </Popup>
          </Marker>
        )}

        <MapAutoBounds points={allPoints as [number, number][]} />
      </MapContainer>
      
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      <style jsx global>{`
          @keyframes dash {
              to { stroke-dashoffset: -20; }
          }
          .animate-dash {
              animation: dash 1s linear infinite;
          }
          .leaflet-container {
              cursor: crosshair !important;
          }
          .custom-tech-indicator {
              background: transparent !important;
              border: none !important;
          }
      `}</style>
    </div>
  );
}
