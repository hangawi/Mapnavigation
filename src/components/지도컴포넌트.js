import React, { useEffect, useRef } from 'react';
//Google Maps를 화면에 보여줌
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

export default MapComponent;