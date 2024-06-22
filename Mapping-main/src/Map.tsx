import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import Modal from 'react-modal';
import { io } from 'socket.io-client';
import { GoogleLogin } from 'react-google-login';
import { FaUser, FaRoute } from 'react-icons/fa'; // Import icons
import './App.css';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const center = {
  lat: 1.3733,
  lng: 32.2903
};

const calculateDistance = (pos1, pos2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = pos1.lat * Math.PI / 180;
  const φ2 = pos2.lat * Math.PI / 180;
  const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
  const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const socket = io('http://localhost:5000'); // Change to your server URL

const Map = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyAcm-rDUPiWMRX-61M-h99z8UWtznRAYxo'
  });

  const [path, setPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isStopTrackingModalOpen, setIsStopTrackingModalOpen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [saveRouteClicked, setSaveRouteClicked] = useState(false);
  const watchIdRef = useRef(null);
  const previousPositionRef = useRef(null);

  const handleShareLiveRoute = () => {
    console.log('Sharing live route:', path);
    socket.emit('shareLiveRoute', path);
  };

  useEffect(() => {
    if (tracking) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newPos = { lat: latitude, lng: longitude };

            if (previousPositionRef.current) {
              const distance = calculateDistance(previousPositionRef.current, newPos);
              if (distance > 5) { // Threshold in meters to detect movement
                setPath(prevPath => {
                  const updatedPath = [...prevPath, newPos];
                  socket.emit('routeUpdate', updatedPath);
                  return updatedPath;
                });
                setCurrentLocation(newPos);
                previousPositionRef.current = newPos;
              }
            } else {
              previousPositionRef.current = newPos;
              setPath(prevPath => {
                const updatedPath = [...prevPath, newPos];
                socket.emit('routeUpdate', updatedPath);
                return updatedPath;
              });
              setCurrentLocation(newPos);
            }
          },
          (error) => console.log(error),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      } else {
        console.log('Geolocation is not supported by this browser.');
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setCurrentLocation(null);
        previousPositionRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking]);

  useEffect(() => {
    socket.on('newRouteData', (data) => {
      setPath(data);
    });

    return () => {
      socket.off('newRouteData');
    };
  }, []);

  const startTracking = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTracking(true);
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPath([newPos]);
        setCurrentLocation(newPos);
        socket.emit('routeUpdate', [newPos]);
      },
      (error) => {
        console.log(error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  const stopTracking = () => {
    setTracking(false);
    setIsStopTrackingModalOpen(true);
  };

  const handleSave = () => {
    if (!user) {
      setShowLogin(true);
    } else {
      console.log('Route saved:', path);
      setIsShareModalOpen(false);
    }
    setSaveRouteClicked(true);
  }

  const handleGoogleLoginSuccess = (response) => {
    console.log('Google authentication successful:', response);
    setUser(response.profileObj);
    setShowLogin(false);
    if (saveRouteClicked) {
      console.log('Route saved:', path);
      setIsShareModalOpen(false);
    }
  };

  const handleGoogleLoginFailure = (response) => {
    console.log('Google authentication failed:', response);
    setShowLogin(false);
  };

  const handleShare = () => {
    setIsShareModalOpen(false);
    setIsPersonModalOpen(true);
  };

  const handleShareRoute = () => {
    const shareMessage = `Check out my route: ${path}`;
    if (navigator.share) {
      navigator.share({
        title: 'My Route',
        text: shareMessage,
        url: window.location.href
      }).then(() => {
        console.log('Thanks for sharing!');
      }).catch(console.error);
    } else {
      console.log('Sharing is not supported by this browser.');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return isLoaded ? (
    <div className="map-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={toggleSidebar}>×</button>
        
        {user && (
          <div>
            <p>Welcome, {user.name}</p>
            <p>Email: {user.email}</p>
          </div>
        )}
        <div className="menu">
          <div className="menu-section" onClick={() => handleSectionClick('account')}>
            <FaUser />
            <span>Account Details</span>
          </div>
          <div className="menu-section" onClick={() => handleSectionClick('saved-routes')}>
            <FaRoute />
            <span>Saved Routes</span>
          </div>
        </div>
        <div>
          {savedRoutes.length > 0 ? (
            <ul>
              {savedRoutes.map((route, index) => (
                <li key={index}>
                  {route.name} - {route.date}
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved routes yet</p>
          )}
        </div>
      </div>
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>
      <div>
        <select onChange={(e) => setMapType(e.target.value)} value={mapType}>
          <option value="roadmap">Roadmap</option>
          <option value="hybrid">Hybrid</option>
          <option value="terrain">Terrain</option>
        </select>
      </div>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15} mapTypeId={mapType}>
        <Polyline path={path} options={{ strokeColor: '#FF0000', strokeOpacity: 1.0, strokeWeight: 2 }} />
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/man.png',
              scaledSize: new window.google.maps.Size(20, 20) // Adjust size if necessary
            }}
          />
        )}
      </GoogleMap>

      <div className="button-container">
        <button onClick={startTracking} disabled={tracking}>Start Tracking</button>
        <button onClick={stopTracking} disabled={!tracking}>Stop Tracking</button>
        <button onClick={handleShareLiveRoute}>Share Live Route</button>
        <button onClick={() => setIsShareModalOpen(true)}>Share Route</button>
        <button onClick={handleSave}>Save Route</button>
      </div>

      <Modal isOpen={isShareModalOpen} onRequestClose={() => setIsShareModalOpen(false)} contentLabel="Share Modal">
        <button className="close-btn" onClick={() => setIsShareModalOpen(false)}>×</button>
        <h2>Share this route</h2>
        <button onClick={handleShareRoute}>Share via Apps</button>
      </Modal>

      <Modal isOpen={isPersonModalOpen} onRequestClose={() => setIsPersonModalOpen(false)} contentLabel="Share with Person Modal">
        <button className="close-btn" onClick={() => setIsPersonModalOpen(false)}>×</button>
        <h2>Share Route with Person</h2>
        <p>Sharing route with selected person is no longer supported.</p>
      </Modal>

      <Modal isOpen={isStopTrackingModalOpen} onRequestClose={() => setIsStopTrackingModalOpen(false)} contentLabel="Stop Tracking Modal">
        <button className="close-btn" onClick={() => setIsStopTrackingModalOpen(false)}>×</button>
        <h2>Stop Tracking</h2>
        <p>Tracking has been stopped.</p>
        <button onClick={() => setIsStopTrackingModalOpen(false)}>Close</button>
      </Modal>

      {showLogin && (
        <div className="login-modal">
          <button className="close-btn" onClick={() => setShowLogin(false)}>×</button>
          <h2>Google Login</h2>
          <GoogleLogin
            clientId="811065719036-e0e9q3c7v1egt6ta9dj3trip50bu5sj6.apps.googleusercontent.com"
            buttonText="Login with Google"
            onSuccess={handleGoogleLoginSuccess}
            onFailure={handleGoogleLoginFailure}
            cookiePolicy={'single_host_origin'}
          />
        </div>
      )}
    </div>
  ) : <div>Loading...</div>
};

export default Map;
