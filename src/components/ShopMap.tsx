import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, AlertCircle, RefreshCw, Compass } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface ShopMapProps {
  address: string;
  lat?: number;
  lng?: number;
  shopName?: string;
  readOnly?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Inner map handler component that uses hooks
function MapController({ address, lat, lng, readOnly, onLocationSelect, shopName }: ShopMapProps) {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectionError('امکان شناسایی موقعیت در مرورگر شما وجود ندارد.');
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setMarkerPosition(coords);
        setIsDetecting(false);
        if (map) {
          map.panTo(coords);
          map.setZoom(16);
        }
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
      },
      (error) => {
        setIsDetecting(false);
        console.error('Geolocation error:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setDetectionError('دسترسی به موقعیت رد شد. لطفاً دسترسی لوکیشن را در مرورگر فعال کنید.');
            break;
          case error.POSITION_UNAVAILABLE:
            setDetectionError('موقعیت جغرافیایی شما در دسترس نیست.');
            break;
          case error.TIMEOUT:
            setDetectionError('زمان درخواست به پایان رسید. دوباره تلاش کنید.');
            break;
          default:
            setDetectionError('خطا در شناسایی موقعیت جغرافیایی.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Initialize marker position from props
  useEffect(() => {
    if (lat && lng) {
      setMarkerPosition({ lat, lng });
      if (map) {
        map.panTo({ lat, lng });
      }
    } else {
      setMarkerPosition(null);
    }
  }, [lat, lng, map]);

  // Geocode address when coordinates are missing
  useEffect(() => {
    if (lat && lng) return; // Already have exact coordinates
    if (!geocodingLib || !address || !map) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    const geocoder = new geocodingLib.Geocoder();
    const delayDebounceFn = setTimeout(() => {
      geocoder.geocode({ address }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setMarkerPosition(coords);
          map.panTo(coords);
          map.setZoom(15);
          
          // If not readOnly, inform the parent component of the geocoded position
          if (!readOnly && onLocationSelect) {
            onLocationSelect(coords.lat, coords.lng);
          }
        } else {
          console.warn('Geocoding failed:', status);
          setGeocodingError('یافتن موقعیت بر روی نقشه ناموفق بود. می‌توانید موقعیت را به صورت دستی روی نقشه انتخاب کنید.');
        }
      });
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [geocodingLib, address, lat, lng, map, readOnly, onLocationSelect]);

  // Handle map clicks for selecting manual position (only when not read-only)
  const handleMapClick = (e: any) => {
    if (readOnly || !onLocationSelect) return;
    const clickedLat = e.detail.latLng.lat;
    const clickedLng = e.detail.latLng.lng;
    setMarkerPosition({ lat: clickedLat, lng: clickedLng });
    onLocationSelect(clickedLat, clickedLng);
  };

  const handleManualGeocode = () => {
    if (!geocodingLib || !address || !map) return;
    setIsGeocoding(true);
    setGeocodingError(null);
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      setIsGeocoding(false);
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        setMarkerPosition(coords);
        map.panTo(coords);
        map.setZoom(16);
        if (onLocationSelect) {
          onLocationSelect(coords.lat, coords.lng);
        }
      } else {
        setGeocodingError('یافتن آدرس روی نقشه امکان‌پذیر نبود. لطفاً موقعیت را دستی انتخاب کنید.');
      }
    });
  };

  // Center on marker if clicked
  const centerOnMarker = () => {
    if (markerPosition && map) {
      map.panTo(markerPosition);
      map.setZoom(15);
    }
  };

  // Default coordinate for centering if nothing is available (Iran Center / Tehran)
  const defaultCenter = markerPosition || { lat: 35.6892, lng: 51.3890 };

  return (
    <div className="relative w-full h-full flex flex-col font-sans">
      <div className="flex-1 relative overflow-hidden rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          onClick={handleMapClick}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {markerPosition && (
            <AdvancedMarker position={markerPosition} title={shopName || 'موقعیت مغازه'}>
              <Pin background="#e11d48" glyphColor="#fff" borderColor="#be123c" />
            </AdvancedMarker>
          )}
        </Map>

        {/* Map UI overlays */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="bg-white hover:bg-slate-50 text-emerald-700 font-bold text-[11px] px-3 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isDetecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                )}
                شناسایی موقعیت من
              </button>

              <button
                type="button"
                onClick={handleManualGeocode}
                disabled={isGeocoding}
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] px-3 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isGeocoding ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                )}
                جستجوی آدرس روی نقشه
              </button>
            </>
          )}

          {markerPosition && (
            <button
              type="button"
              onClick={centerOnMarker}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] px-3 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              تمرکز روی موقعیت
            </button>
          )}
        </div>

        {/* Coordinate Display & Manual Edit Overlay */}
        {!readOnly && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md z-10 flex flex-col gap-1.5 w-[140px]" dir="rtl">
            <span className="text-[9px] text-slate-400 font-bold block text-right">مختصات جغرافیایی:</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-400 font-mono w-5 text-left">Lat:</span>
                <input
                  type="number"
                  step="0.000001"
                  value={markerPosition ? Number(markerPosition.lat.toFixed(6)) : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      const newCoords = { lat: val, lng: markerPosition?.lng || 51.3890 };
                      setMarkerPosition(newCoords);
                      if (onLocationSelect) onLocationSelect(newCoords.lat, newCoords.lng);
                      if (map) map.panTo(newCoords);
                    }
                  }}
                  placeholder="---"
                  className="w-full text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 text-left"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-400 font-mono w-5 text-left">Lng:</span>
                <input
                  type="number"
                  step="0.000001"
                  value={markerPosition ? Number(markerPosition.lng.toFixed(6)) : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      const newCoords = { lat: markerPosition?.lat || 35.6892, lng: val };
                      setMarkerPosition(newCoords);
                      if (onLocationSelect) onLocationSelect(newCoords.lat, newCoords.lng);
                      if (map) map.panTo(newCoords);
                    }
                  }}
                  placeholder="---"
                  className="w-full text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 text-left"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status/Error Messages */}
        {(isGeocoding || geocodingError || isDetecting || detectionError) && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg text-right z-10 transition">
            {isGeocoding && (
              <div className="flex items-center justify-end gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <span>درحال مکان‌یابی آدرس روی نقشه...</span>
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
            {isDetecting && (
              <div className="flex items-center justify-end gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>درحال شناسایی موقعیت جغرافیایی شما...</span>
                <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
              </div>
            )}
            {geocodingError && !isGeocoding && (
              <div className="flex items-center justify-end gap-2 text-[10px] text-amber-700 dark:text-amber-400 font-extrabold">
                <span className="leading-relaxed">{geocodingError}</span>
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
            )}
            {detectionError && !isDetecting && (
              <div className="flex items-center justify-end gap-2 text-[10px] text-rose-700 dark:text-rose-400 font-extrabold">
                <span className="leading-relaxed">{detectionError}</span>
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              </div>
            )}
          </div>
        )}

        {/* Info Header */}
        {!readOnly && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none">
            📍 جهت تعیین مکان دقیق، روی نقشه کلیک کنید
          </div>
        )}
      </div>

      {/* External Action Button */}
      {markerPosition && (
        <div className="mt-2 text-left">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`}
            target="_blank"
            referrerPolicy="no-referrer"
            className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-lg transition"
          >
            🗺️ نمایش بزرگ‌تر در گوگل‌مپس
          </a>
        </div>
      )}
    </div>
  );
}

export default function ShopMap(props: ShopMapProps) {
  const [mapAuthError, setMapAuthError] = useState<boolean>(false);

  useEffect(() => {
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setMapAuthError(true);
      if (originalAuthFailure) {
        originalAuthFailure();
      }
    };
    return () => {
      (window as any).gm_authFailure = originalAuthFailure;
    };
  }, []);

  if (!hasValidKey || mapAuthError) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-right space-y-4">
        <div className="flex items-center justify-end gap-2 text-rose-600 border-b border-rose-100 pb-3">
          <span className="text-sm font-black">
            {mapAuthError ? 'خطا در اعتبار کلید نقشه (Invalid Key)' : 'راهنمای راه‌اندازی نقشه تعاملی مغازه'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <p className="font-bold text-slate-800">
            {mapAuthError 
              ? 'کلید ثبت شده برای گوگل مپس معتبر نیست یا دسترسی آن مسدود شده است. لطفا طبق راهنمای زیر یک کلید معتبر جایگزین کنید:' 
              : 'برای نمایش نقشه تعاملی مغازه بر اساس آدرس، نیاز به تعریف کلید API گوگل مپس وجود دارد:'}
          </p>
          
          <ol className="list-decimal list-inside space-y-2 pr-2 text-[11px] font-semibold text-slate-600">
            <li>
              دریافت کلید اختصاصی گوگل مپس از:{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono"
              >
                کنسول ابری گوگل
              </a>
            </li>
            <li>
              ثبت کلید جدید در Secrets سیستم:
              <ul className="list-disc list-inside pr-4 mt-1 text-[10px] space-y-1 text-slate-500">
                <li>منوی تنظیمات بالا سمت راست (⚙️ آیکون چرخ‌دنده) را باز کنید.</li>
                <li>بخش <span className="font-black text-slate-800">Secrets</span> را انتخاب کنید.</li>
                <li>نام متغیر را دقیقاً <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-mono font-bold">GOOGLE_MAPS_PLATFORM_KEY</code> وارد کنید.</li>
                <li>کلید API کپی شده را جایگذاری کرده و تایید نمایید.</li>
              </ul>
            </li>
          </ol>
          
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[11px] font-bold text-amber-800">
            ℹ️ پس از ذخیره کلید جدید، برنامه به‌طور خودکار مجدداً ساخته شده و نقشه تعاملی به‌جای این راهنما نمایش داده خواهد شد.
          </div>
        </div>

        {props.address && (
          <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 mt-2 text-slate-700 text-xs flex items-start gap-2 justify-end">
            <div className="text-right">
              <span className="font-extrabold text-[10px] text-slate-400 block mb-0.5">آدرس ثبت شده مغازه:</span>
              <span className="font-black text-slate-800">{props.address}</span>
            </div>
            <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          </div>
        )}
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <MapController {...props} />
    </APIProvider>
  );
}
