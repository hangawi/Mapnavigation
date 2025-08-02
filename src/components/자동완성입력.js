import React, { useEffect, useRef } from 'react';
//Google Maps Places API를 사용하여 주소나 장소를 입력할 때 자동 완성 기능을 제공

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

export default AutocompleteInput;