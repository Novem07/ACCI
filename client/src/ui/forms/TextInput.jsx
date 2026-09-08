import React, { forwardRef } from 'react';
import styles from './FormField.module.css';

const TextInput = forwardRef(function TextInput({ className = '', ...inputProps }, ref) {
  return <input ref={ref} className={`${styles.control} ${className}`.trim()} {...inputProps} />;
});

export default TextInput;
