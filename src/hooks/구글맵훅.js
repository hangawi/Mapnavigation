import { useState, useRef, useCallback } from 'react';
//Google Maps와 관련된 모든 핵심 로직과 상태를 관리
let nextId = 0;
const getUniqueId = () => new Date().getTime() + nextId++;

export const useGoogleMaps = (initialCenter) => {
    const [map, setMap] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    const [startPointText, setStartPointText] = useState('');
    const [destinations, setDestinations] = useState([{ id: getUniqueId(), place: null }]);
    const [center, setCenter] = useState(initialCenter);

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
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setStartPoint({ geometry: { location: new window.google.maps.LatLng(pos.lat, pos.lng) }, name: '현재 위치' });
                setStartPointText('현재 위치');
                setCenter(pos);
                if (map) {
                    map.setCenter(pos);
                    map.setZoom(14);
                    const marker = new window.google.maps.Marker({ 
                        position: pos, 
                        map, 
                        title: '현재 위치',
                        icon: {
                            url: '/1.png',
                            scaledSize: new window.google.maps.Size(50, 50),
                            origin: new window.google.maps.Point(0, 0),
                            anchor: new window.google.maps.Point(25, 25),
                        }
                    });
                    markersRef.current.push(marker);
                }
            }, () => alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 정보 설정을 확인해주세요.'));
        } else {
            alert('이 브라우저에서는 Geolocation이 지원되지 않습니다.');
        }
    }, [map, clearMap]);

    const handleStartPointChange = (place) => {
        if (place.geometry) {
            setStartPoint(place);
            setStartPointText(place.name);
        }
    };

    // id를 기준으로 목적지 변경
    const handleDestinationChange = (id, place) => {
        const newDests = destinations.map(dest => 
            dest.id === id ? { ...dest, place: { ...dest.place, ...place } } : dest
        );
        setDestinations(newDests);
    };

    const addDestination = () => {
        if (destinations.length < 10) {
            setDestinations([...destinations, { id: getUniqueId(), place: null }]);
        }
    };

    // id를 기준으로 목적지 삭제
    const removeDestination = (id) => {
        setDestinations(destinations.filter(dest => dest.id !== id));
    };

    const calculateOptimalRoute = async () => {
        clearMap();
        if (!startPoint) return alert('출발지를 설정해주세요.');
        // place 객체만 추출하고 null이 아닌 것만 필터링
        const validDests = destinations.map(d => d.place).filter(Boolean);
        if (validDests.length < 1) return alert('하나 이상의 목적지를 설정해주세요.');

        const allPoints = [startPoint, ...validDests];
        const locations = allPoints.map(p => p.geometry.location);

        const distanceMatrixService = new window.google.maps.DistanceMatrixService();
        try {
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
                    throw new Error('일부 목적지 간의 대중교통 경로를 찾을 수 없습니다.');
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
        } catch (error) {
            alert(error.message);
        }
    };

    return {
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
    };
};
