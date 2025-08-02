import React from 'react';
//메인 제어판이 접혔을 때(축소되었을 때) 보여줄수 있게해주는 컴포넌트
const CollapsedPanel = ({ togglePanel, fetchAndSetCurrentLocation }) => {
    return (
        <div className="collapsed-panel">
            <button onClick={togglePanel} className="toggle-panel-btn">
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
            </button>
            <div className="icon-menu">
                <button onClick={fetchAndSetCurrentLocation} className="icon-btn" title="현재 위치로 이동"></button>
                <button className="icon-btn" title="기능 2"></button>
                <button className="icon-btn" title="기능 3"></button>
            </div>
        </div>
    );
};

export default CollapsedPanel;
