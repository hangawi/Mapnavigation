import React from 'react';
import AutocompleteInput from './자동완성입력';
import DirectionsPanel from './경로패널';
//메인 제어판이 펼쳐졌을 때(확장되었을 때) 보여지는 컴포넌트
const ExpandedPanel = ({
    togglePanel,
    startPointText,
    setStartPointText,
    handleStartPointChange,
    fetchAndSetCurrentLocation,
    destinations,
    handleDestinationChange,
    removeDestination,
    addDestination,
    calculateOptimalRoute
}) => {

    return (
        <div className="expanded-panel">
            <div className="title-container">
                <h1 className="title">최적 경로 안내</h1>
                <button onClick={togglePanel} className="toggle-panel-btn">
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
            </div>

            <div className="panel-content">
                <div className="section-title">출발지 설정</div>
                <div className="start-point-controls">
                    <button onClick={fetchAndSetCurrentLocation} className="btn btn-primary">현재 위치 재설정</button>
                    <AutocompleteInput
                        onPlaceChanged={handleStartPointChange}
                        placeholder="또는, 가상 출발지 검색"
                        value={startPointText}
                        onInputChange={(e) => setStartPointText(e.target.value)}
                    />
                </div>

                <div className="section-title">목적지 설정 ({destinations.length}/10)</div>
                <div className="destination-list-container">
                    <div className="destination-list">
                        {destinations.map((dest, index) => (
                            <div key={dest.id} className="destination-input-container">
                                <AutocompleteInput
                                    onPlaceChanged={(p) => handleDestinationChange(dest.id, p)}
                                    placeholder={`목적지 ${index + 1}`}
                                    value={dest.place ? dest.place.name : ''}
                                    onInputChange={(e) => handleDestinationChange(dest.id, { name: e.target.value, geometry: null })} // 텍스트 입력 시 임시 처리
                                />
                                {destinations.length > 1 &&
                                    <button onClick={() => removeDestination(dest.id)} className="remove-destination-btn">X</button>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-buttons-container">
                    {destinations.length < 10 && <button onClick={addDestination} className="btn btn-add">목적지 추가</button>}
                    <button onClick={calculateOptimalRoute} className="btn btn-calculate">최적 경로 찾기</button>
                </div>

                <DirectionsPanel />
            </div>
        </div>
    );
};

export default ExpandedPanel;
