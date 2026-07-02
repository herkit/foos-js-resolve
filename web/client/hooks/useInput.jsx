import React, { useState } from 'react'

function useInput({ type, className }) {
    const [value, setValue] = useState("");
    const input = <input value={value} onChange={e => setValue(e.target.value)} type={type} className={className} />;
    return [value, input];
}

export default useInput