import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const center = {
  lat: 0.3476, // Center of the map (Kampala)
  lng: 32.5825,
};

const pathCoordinates = [
  { lat: 0.3476, lng: 32.5825 }, // Kampala
  { lat: -15.3875, lng: 28.3228 }, // Lusaka
  { lat: -17.8579, lng: 25.8562 }, // Livingstone
  { lat: -26.5225, lng: 31.4659 }, // Eswatini
];

const App: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState(pathCoordinates[0]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < pathCoordinates.length) {
          setCurrentPosition(pathCoordinates[nextIndex]);
          return nextIndex;
        } else {
          clearInterval(interval);
          return prevIndex;
        }
      });
    }, 2000); // Move the bus every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <LoadScript googleMapsApiKey="AIzaSyCf7LatdE_-6ZV5I9Doa-9KKHC2kw88sxw">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
        <Polyline path={pathCoordinates} options={{ strokeColor: '#FF0000' }} />
        <Marker position={currentPosition} icon={{ url: 'https://img.icons8.com/ios-filled/50/000000/bus.png', scaledSize: new window.google.maps.Size(50, 50) }} />
      </GoogleMap>
    </LoadScript>
  );
};

export default App;