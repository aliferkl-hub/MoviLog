import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteStop, Vehicle } from '../../types';

interface RouteMapProps {
  stops: RouteStop[];
  vehicle?: Vehicle;
  height?: string;
  selectedStopIndex?: number;
  onSelectStop?: (index: number) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  stops,
  vehicle,
  height = '420px',
  selectedStopIndex,
  onSelectStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([-23.5505, -46.6333], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const validCoords: L.LatLngTuple[] = [];

    // Add Stops with real coordinates only (do not invent coordinates)
    stops.forEach((stop, index) => {
      const hasRealCoords = typeof stop.lat === 'number' && typeof stop.lng === 'number' && !isNaN(stop.lat) && !isNaN(stop.lng) && (stop.lat !== 0 || stop.lng !== 0);
      if (!hasRealCoords) return;

      const coord: L.LatLngTuple = [stop.lat!, stop.lng!];
      validCoords.push(coord);

      const isSelected = selectedStopIndex === index;
      const isDelivered = stop.status === 'entregue';
      const isFailed = stop.status === 'tentativa_falha';

      const bgColor = isDelivered ? '#10b981' : isFailed ? '#f43f5e' : isSelected ? '#6366f1' : '#0284c7';
      const borderColor = isSelected ? '#ffffff' : '#0f172a';

      const customIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #ffffff;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            border: 2px solid ${borderColor};
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            cursor: pointer;
            transform: translate(-15px, -15px);
          ">
            ${stop.ordem}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(coord, { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0f172a;">
          <strong style="color: #4338ca; display: block; margin-bottom: 2px;">Parada #${stop.ordem} • ${stop.codigoRastreio}</strong>
          <strong>${stop.destinatario}</strong><br/>
          <span>${stop.enderecoCompleto}</span><br/>
          <span style="font-size: 11px; color: #64748b;">${stop.bairro} - ${stop.cidade}</span><br/>
          <div style="margin-top: 4px; font-weight: 600;">Volumes: ${stop.volumes} | Peso: ${stop.pesoKg} kg</div>
          <div style="color: ${isDelivered ? '#059669' : isFailed ? '#e11d48' : '#d97706'}; font-weight: bold; margin-top: 2px;">
            Status: ${stop.status}
          </div>
        </div>
      `);

      if (onSelectStop) {
        marker.on('click', () => onSelectStop(index));
      }

      markersLayer.addLayer(marker);
    });

    // Add Vehicle Position Marker if available
    if (vehicle?.ultimaLocalizacao?.lat && vehicle?.ultimaLocalizacao?.lng) {
      const vLat = vehicle.ultimaLocalizacao.lat;
      const vLng = vehicle.ultimaLocalizacao.lng;
      const vCoord: L.LatLngTuple = [vLat, vLng];
      validCoords.push(vCoord);

      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 900;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(139,92,246,0.6);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <span>🚚 ${vehicle.placa}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const vehMarker = L.marker(vCoord, { icon: vehicleIcon });
      vehMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong style="color: #6d28d9;">${vehicle.identificacao} (${vehicle.placa})</strong><br/>
          <span>Velocidade: ${Math.round(vehicle.ultimaLocalizacao.velocidade || 0)} km/h</span><br/>
          <span style="font-size: 10px; color: #64748b;">Último sinal: ${new Date(vehicle.ultimaLocalizacao.atualizadoEm).toLocaleTimeString()}</span>
        </div>
      `);
      markersLayer.addLayer(vehMarker);
    }

    // Connect stops with colored polyline
    if (validCoords.length > 1) {
      // Draw path between ordered stops
      const stopCoords = stops
        .filter(s => s.lat && s.lng)
        .map(s => [s.lat!, s.lng!] as L.LatLngTuple);

      if (stopCoords.length > 1) {
        polylineRef.current = L.polyline(stopCoords, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 6'
        }).addTo(map);
      }

      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [stops, vehicle, selectedStopIndex]);

  const stopsWithoutCoords = stops.filter(
    s => !(typeof s.lat === 'number' && typeof s.lng === 'number' && !isNaN(s.lat) && !isNaN(s.lng) && (s.lat !== 0 || s.lng !== 0))
  );

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 10 }} />
      {stops.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 text-slate-400 text-xs font-semibold">
          Nenhuma parada com coordenadas selecionada
        </div>
      )}
      {stopsWithoutCoords.length > 0 && (
        <div className="absolute bottom-2 right-2 z-20 bg-slate-900/90 backdrop-blur-sm border border-amber-500/30 text-amber-300 text-[10px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 font-medium">
          <span>⚠️ {stopsWithoutCoords.length} parada(s) sem coordenadas confirmadas (agrupadas por CEP/Bairro)</span>
        </div>
      )}
    </div>
  );
};
