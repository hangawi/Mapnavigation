import React, { useState, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { useGoogleMaps } from './hooks/구글맵훅';
import MapComponent from './components/지도컴포넌트';
import ExpandedPanel from './components/확장패널';
import CollapsedPanel from './components/축소패널';
import './App.css';

const API_KEY = 'AIzaSyCVAdYVBcMGTQvtgB18xkFr7_aANa-N2Ic'; // 사용자의 API 키
const INITIAL_CENTER = { lat: 37.5665, lng: 126.9780 }; // Default: Seoul

function App() {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const {
        map,
        setMap,
        center,
        startPointText,
        setStartPointText,
        destinations,
        fetchAndSetCurrentLocation,
        handleStartPointChange,
        handleDestinationChange,
        addDestination,
        removeDestination,
        calculateOptimalRoute
    } = useGoogleMaps(INITIAL_CENTER);

    useEffect(() => {
        if (map) {
            fetchAndSetCurrentLocation();
        }
    }, [map, fetchAndSetCurrentLocation]);

    return (
        <Wrapper apiKey={API_KEY} libraries={['places', 'routes']}>
            <div className="app-container">
                <div className={`controls-container ${isPanelVisible ? '' : 'collapsed'}`}>
                    {isPanelVisible ? (
                        <ExpandedPanel 
                            togglePanel={() => setIsPanelVisible(false)}
                            startPointText={startPointText}
                            setStartPointText={setStartPointText}
                            handleStartPointChange={handleStartPointChange}
                            fetchAndSetCurrentLocation={fetchAndSetCurrentLocation}
                            destinations={destinations}
                            handleDestinationChange={handleDestinationChange}
                            removeDestination={removeDestination}
                            addDestination={addDestination}
                            calculateOptimalRoute={calculateOptimalRoute}
                        />
                    ) : (
                        <CollapsedPanel 
                            togglePanel={() => setIsPanelVisible(true)}
                            fetchAndSetCurrentLocation={fetchAndSetCurrentLocation} 
                        />
                    )}
                </div>
                <div className="map-container">
                    <MapComponent center={center} zoom={12} onMapLoad={setMap} />
                </div>
            </div>
        </Wrapper>
    );
}

export default App;