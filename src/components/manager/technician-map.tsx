'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '@/lib/auth';
import { getCoordinates } from '@/lib/geo-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Car, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Fix for default Leaflet icons in Next.js
const fixLeafletIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface TechLocation {
    tech: User;
    city: string;
    status: string;
    tripName: string;
}

interface TechnicianMapProps {
    locations: TechLocation[];
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 4);
    }, [center, map]);
    return null;
}

export default function TechnicianMap({ locations }: TechnicianMapProps) {
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    const createCustomIcon = (tech: User, status: string) => {
        const isTraveling = status === 'Em Viagem';
        const isWorking = status === 'Em Atendimento';

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="relative flex items-center justify-center">
                    ${isTraveling ? `
                        <div class="absolute -top-4 -right-4 bg-blue-500 text-white p-1 rounded-full shadow-lg animate-bounce z-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                        </div>
                    ` : ''}
                    <div class="w-12 h-12 rounded-full border-4 ${isTraveling ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : isWorking ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]'} overflow-hidden bg-[#0a0a0b] transition-all hover:scale-110">
                        <img src="${tech.avatar_url || ''}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=8b5cf6&color=fff'" />
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
        });
    };

    return (
        <div className="w-full h-[600px] rounded-[3rem] overflow-hidden border border-white/5 glass-card shadow-2xl relative">
            <MapContainer 
                center={[-15.7801, -47.9292]} 
                zoom={4} 
                style={{ height: '100%', width: '100%', background: '#0a0a0b' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {locations.map((loc, i) => {
                    const coords = getCoordinates(loc.city);
                    if (!coords) return null;

                    return (
                        <Marker 
                            key={loc.tech.id} 
                            position={[coords.lat, coords.lng]}
                            icon={createCustomIcon(loc.tech, loc.status)}
                        >
                            <Popup className="premium-popup">
                                <div className="p-4 min-w-[200px] bg-[#0a0a0b] text-white rounded-2xl border border-white/10 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={loc.tech.avatar_url} />
                                            <AvatarFallback>{loc.tech.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-bold text-sm leading-none">{loc.tech.name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{loc.status}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="w-3.5 h-3.5 text-primary" />
                                            <span>{loc.city}</span>
                                        </div>
                                        {loc.tripName !== '-' && (
                                            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                                <div className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">Viagem</div>
                                                <div className="text-[10px] font-bold truncate">{loc.tripName}</div>
                                            </div>
                                        )}
                                        <Link href={`/manager/tracking/${loc.tech.id}`} className="block mt-3">
                                            <button className="w-full py-2 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                                                Ver Detalhes
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Overlay UI */}
            <div className="absolute top-6 left-6 z-[1000] p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 border-l-4 border-l-primary shadow-2xl">
                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1">Rastreamento Global</h4>
                <p className="text-muted-foreground/60 text-[10px] uppercase tracking-widest">
                    {locations.filter(l => l.status !== 'Disponível').length} Técnicos em Campo
                </p>
            </div>
            
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Em Atendimento</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Em Deslocamento</span>
                </div>
            </div>

            <style jsx global>{`
                .leaflet-container {
                    cursor: crosshair !important;
                }
                .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                }
                .leaflet-popup-tip-container {
                    display: none !important;
                }
                .custom-div-icon {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
}
