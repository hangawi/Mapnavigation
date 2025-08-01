import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import './App.css';

const API_KEY = 'AIzaSyCVAdYVBcMGTQvtgB18xkFr7_aANa-N2Ic'; // 사용자의 API 키

// --- Helper Components ---
const MapComponent = ({ center, zoom, children, onMapLoad }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && !window.mapInstance) {
            window.mapInstance = new window.google.maps.Map(ref.current, { center, zoom, mapTypeControl: false });
            onMapLoad(window.mapInstance);
        }
    }, [ref, center, zoom, onMapLoad]);

    return (
        <div ref={ref} style={{ flexGrow: '1', height: "100%" }}>
            {React.Children.map(children, child =>
                React.isValidElement(child) ? React.cloneElement(child, { map: window.mapInstance }) : child
            )}
        </div>
    );
};

const AutocompleteInput = ({ onPlaceChanged, placeholder, value, onInputChange }) => {
    const inputRef = useRef(null);
    useEffect(() => {
        if (inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode', 'establishment'] });
            autocomplete.addListener('place_changed', () => onPlaceChanged(autocomplete.getPlace()));
        }
    }, [onPlaceChanged]);
    return <input ref={inputRef} className="destination-input" placeholder={placeholder} value={value} onChange={onInputChange} />;
};

// --- Main App Component ---
function App() {
    const [map, setMap] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    const [startPointText, setStartPointText] = useState('');
    const [destinations, setDestinations] = useState([null]);
    const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // Default: Seoul

    const renderersRef = useRef([]);
    const markersRef = useRef([]);

    const clearMap = useCallback(() => {
        renderersRef.current.forEach(r => r.setMap(null));
        renderersRef.current = [];
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        const panel = document.getElementById('directions-panel-react');
        if (panel) panel.innerHTML = '';
    }, []);

    const fetchAndSetCurrentLocation = useCallback(() => {
        clearMap();
        navigator.geolocation.getCurrentPosition(position => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            setStartPoint({ geometry: { location: new window.google.maps.LatLng(pos.lat, pos.lng) }, name: '현재 위치' });
            setStartPointText('현재 위치');
            if (map) {
                map.setCenter(pos);
                map.setZoom(14);
                const marker = new window.google.maps.Marker({
                    position: pos, 
                    map, 
                    title: '현재 위치',
                    icon: {
                        url: '1.png',
                        scaledSize: new window.google.maps.Size(50, 50),
                    }
                });
                markersRef.current.push(marker);
            }
        }, () => alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 정보 설정을 확인해주세요.'));
    }, [map, clearMap]);

    useEffect(() => {
        if (map) {
            fetchAndSetCurrentLocation();
        }
    }, [map, fetchAndSetCurrentLocation]);

    const handleStartPointChange = (place) => {
        if (place.geometry) {
            setStartPoint(place);
            setStartPointText(place.name);
        }
    };

    const handleDestinationChange = (place, index) => {
        if (place.geometry) {
            const newDests = [...destinations];
            newDests[index] = place;
            setDestinations(newDests);
        }
    };

    const addDestination = () => {
        if (destinations.length < 10) setDestinations([...destinations, null]);
    };

    const removeDestination = (index) => {
        setDestinations(destinations.filter((_, i) => i !== index));
    };

    const calculateOptimalRoute = async () => {
        clearMap();
        if (!startPoint) return alert('출발지를 설정해주세요.');
        const validDests = destinations.filter(Boolean);
        if (validDests.length < 1) return alert('하나 이상의 목적지를 설정해주세요.');

        const allPoints = [startPoint, ...validDests];
        const locations = allPoints.map(p => p.geometry.location);

        const distanceMatrixService = new window.google.maps.DistanceMatrixService();
        const matrixResponse = await new Promise((resolve, reject) => {
            distanceMatrixService.getDistanceMatrix({ origins: locations, destinations: locations, travelMode: 'TRANSIT' }, (res, status) => {
                if (status === 'OK') resolve(res);
                else reject(new Error('거리 계산 실패: ' + status));
            });
        });

        let unvisitedIndices = Array.from({ length: validDests.length }, (_, i) => i + 1);
        let currentPointIndex = 0;
        const orderedRouteIndices = [0];

        while (unvisitedIndices.length > 0) {
            let nearest = { index: -1, duration: Infinity };
            const matrixRow = matrixResponse.rows[currentPointIndex].elements;
            
            unvisitedIndices.forEach(destIndex => {
                const element = matrixRow[destIndex];
                if (element.status === 'OK' && element.duration.value < nearest.duration) {
                    nearest = { index: destIndex, duration: element.duration.value };
                }
            });

            if (nearest.index === -1) {
                return alert('일부 목적지 간의 대중교통 경로를 찾을 수 없습니다.');
            }

            orderedRouteIndices.push(nearest.index);
            currentPointIndex = nearest.index;
            unvisitedIndices = unvisitedIndices.filter(i => i !== nearest.index);
        }

        const orderedPoints = orderedRouteIndices.map(i => allPoints[i]);
        const directionsService = new window.google.maps.DirectionsService();
        const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#FF7043', '#78909C', '#17A2B8', '#28A745', '#6F42C1'];
        const panel = document.getElementById('directions-panel-react');

        for (let i = 0; i < orderedPoints.length - 1; i++) {
            const request = {
                origin: orderedPoints[i].geometry.location,
                destination: orderedPoints[i + 1].geometry.location,
                travelMode: 'TRANSIT',
            };
            const result = await directionsService.route(request);
            const renderer = new window.google.maps.DirectionsRenderer({
                map,
                directions: result,
                suppressMarkers: true,
                polylineOptions: { strokeColor: colors[i % colors.length], strokeWeight: 5, strokeOpacity: 0.8 },
                preserveViewport: true,
            });
            
            const legPanel = document.createElement('div');
            legPanel.innerHTML = `<h3>경로 ${i + 1}: ${orderedPoints[i].name} → ${orderedPoints[i+1].name}</h3>`;
            panel.appendChild(legPanel);
            renderer.setPanel(legPanel);
            renderersRef.current.push(renderer);
        }

        orderedPoints.forEach((point, i) => {
            const marker = new window.google.maps.Marker({
                position: point.geometry.location,
                map,
                label: i === 0 ? '출발' : String(i),
                title: point.name,
            });
            markersRef.current.push(marker);
        });
    };

    return (
        <Wrapper apiKey={API_KEY} libraries={['places', 'routes']}>
            <div className="app-container">
                <div className="controls-container">
                    <h1 className="title">최적 경로 안내</h1>
                    <div className="section-title">출발지 설정</div>
                    <div className="start-point-controls">
                        <div className="start-point-buttons">
                            <button onClick={fetchAndSetCurrentLocation} className="btn btn-primary">현재 위치 재설정</button>
                        </div>
                        <AutocompleteInput onPlaceChanged={handleStartPointChange} placeholder="또는, 가상 출발지 검색" value={startPointText} onInputChange={(e) => setStartPointText(e.target.value)} />
                    </div>
                    <div className="section-title">목적지 설정 ({destinations.length}/10)</div>
                    <div className="destination-list">
                        {destinations.map((_, index) => (
                            <div key={index} className="destination-input-container">
                                <AutocompleteInput onPlaceChanged={(p) => handleDestinationChange(p, index)} placeholder={`목적지 ${index + 1}`} />
                                {destinations.length > 1 && <button onClick={() => removeDestination(index)} className="remove-destination-btn">X</button>}
                            </div>
                        ))}
                        {destinations.length < 10 && <button onClick={addDestination} className="btn btn-add">목적지 추가</button>}
                    </div>
                    <button onClick={calculateOptimalRoute} className="btn btn-calculate">최적 경로 찾기</button>
                    <div id="directions-panel-react" style={{flexGrow: 1, overflowY: 'auto', paddingTop: '10px'}}></div>
                </div>
                <div className="map-container">
                    <MapComponent center={center} zoom={12} onMapLoad={setMap} />
                </div>
            </div>
        </Wrapper>
    );
}

export default App;
