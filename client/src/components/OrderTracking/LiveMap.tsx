import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPinIcon } from "lucide-react";
import { iconsForLeafpad } from "../../assets/assets";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

export default function LiveMap({ order, liveLocation }: { order: any; liveLocation: any }) {
    if (order?.status === "Delivered") return null;

    // Custom delivery truck icon
    const truckIcon = new L.Icon({
        iconUrl: iconsForLeafpad.truck,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });

    // Destination pin icon
    const destinationIcon = new L.Icon({
        iconUrl: iconsForLeafpad.destination,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    // Component to re-center map when location changes
    function MapUpdater({ center }: { center: [number, number] }) {
        const map = useMap();
        useEffect(() => {
            map.setView(center, map.getZoom());
        }, [center, map]);
        return null;
    }

    const lat = liveLocation?.lat || order?.shippingAddress?.lat || 40.7128;
    const lng = liveLocation?.lng || order?.shippingAddress?.lng || -74.006;
    const hasCoords = Boolean(lat && lng);

    return (
        <div className="rounded-2xl overflow-hidden shadow-xs border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-900 h-[340px] w-full relative z-0">
            {hasCoords ? (
                <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {order.status !== "Delivered" && (
                        <Marker position={[lat, lng]} icon={truckIcon}>
                            <Popup>Delivery Partner</Popup>
                        </Marker>
                    )}
                    {order.shippingAddress?.lat && order.shippingAddress?.lng && (
                        <Marker position={[order.shippingAddress.lat, order.shippingAddress.lng]} icon={destinationIcon}>
                            <Popup>Delivery Address ({order.shippingAddress.label})</Popup>
                        </Marker>
                    )}
                    <MapUpdater center={[lat, lng]} />
                </MapContainer>
            ) : (
                <div className="h-full bg-app-green/5 flex-center">
                    <div className="text-center">
                        <MapPinIcon className="size-8 text-app-green/40 mx-auto mb-2" />
                        <p className="text-sm text-app-green/50 font-medium">Map Location Unavailable</p>
                    </div>
                </div>
            )}
        </div>
    );
}
