import React from "react";

export default () => <div
    style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '.5rem'
    }}>
    L O A D I N G . . .
    <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
</div>