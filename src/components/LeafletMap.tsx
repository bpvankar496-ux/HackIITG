/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HeritageSite } from '../types';

interface LeafletMapProps {
  sites: HeritageSite[];
  selectedSiteId?: string | null;
  onSelectSite: (site: HeritageSite) => void;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  height = '500px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 73.5], // Centered over Gujarat / Western India
        zoom: 6,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Custom marker icon
    const createCustomIcon = (isSelected: boolean, category: string) => {
      const color = isSelected ? '#667653' : '#B65F43';
      const size = isSelected ? 24 : 18;
      const html = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        "></div>
      `;
      return L.divIcon({
        className: 'custom-heritage-marker',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    };

    // Add markers for all sites with valid coordinates
    sites.forEach((site) => {
      if (site.lat == null || site.lng == null) return;

      const isSelected = site.id === selectedSiteId;
      const marker = L.marker([site.lat, site.lng], {
        icon: createCustomIcon(isSelected, site.category),
        title: site.name,
      });

      const popupContent = `
        <div style="font-family: inherit; max-width: 240px; padding: 4px;">
          <h3 style="font-weight: 700; margin: 0 0 4px 0; font-size: 15px; color: #292821;">${site.name}</h3>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #777267;">
            ${site.district ? site.district + ', ' : ''}${site.state} &bull; ${site.category}
          </p>
          <div style="font-size: 11px; margin-bottom: 8px; color: #667653; font-weight: 600;">
            ${site.verification === 'verified' ? '✓ Verified Monument' : 'Community Archive'}
          </div>
          <button id="view-site-${site.id}" style="
            background: #B65F43;
            color: #fff;
            border: none;
            padding: 4px 10px;
            font-size: 12px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          ">View Details</button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-site-${site.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectSite(site);
          };
        }
      });

      marker.addTo(map);
      markersRef.current[site.id] = marker;
    });

    // If a site is selected, center map on it
    if (selectedSiteId) {
      const selectedSite = sites.find((s) => s.id === selectedSiteId);
      if (selectedSite && selectedSite.lat != null && selectedSite.lng != null) {
        map.setView([selectedSite.lat, selectedSite.lng], 9, { animate: true });
        const m = markersRef.current[selectedSiteId];
        if (m) m.openPopup();
      }
    }
  }, [sites, selectedSiteId, onSelectSite]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-lg border border-[#DCC9AD] shadow-inner"
    />
  );
};
