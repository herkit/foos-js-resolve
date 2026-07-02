import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'

const ConfirmButton = ({ confirmText, size, text, style, onConfirm, timeout }) => {
  var confirmTimeout;
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (confirm)
      confirmTimeout = setTimeout(() => setConfirm(false), timeout ?? 2500)

    return () => {
      if (confirmTimeout)
        clearTimeout(confirmTimeout)
    }
  }, [confirm]);

  return confirm ? <Button onClick={onConfirm} className="btn-danger" style={style} size={size}>{confirmText ?? "Sure?"}</Button> : <Button onClick={() => setConfirm(true)} style={style} size={size}>{text}</Button>
}

export default ConfirmButton