import React from 'react';
//지도에 표시된 최적 경로의 상세 정보를 텍스트로 보여줌
const DirectionsPanel = () => {
    return (
        <div id="directions-panel-react" style={{flexGrow: 1, overflowY: 'auto', paddingTop: '10px'}}></div>
    );
};

export default DirectionsPanel;
