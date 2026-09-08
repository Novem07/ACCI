import React, { useEffect, useRef } from 'react';
import styles from './feedback.module.css';

export default function Dialog({ open, title, description, onClose, children, footer }) {
  const closeButton = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (open) { trigger.current = document.activeElement; closeButton.current?.focus(); }
    else if (trigger.current) trigger.current.focus();
  }, [open]);
  if (!open) return null;
  return <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><dialog className={styles.dialog} open aria-labelledby="dialog-title" aria-describedby={description ? 'dialog-description' : undefined} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}><header><h2 id="dialog-title">{title}</h2><button ref={closeButton} type="button" aria-label="Đóng" onClick={onClose}>×</button></header>{description && <p id="dialog-description">{description}</p>}<div>{children}</div>{footer && <footer>{footer}</footer>}</dialog></div>;
}
