import React from 'react';
import styles from './FormField.module.css';

export default function RadioGroup({ label, name, value, onChange, options, disabled = false }) {
  return <fieldset className={styles.radioGroup} disabled={disabled}><legend>{label}</legend>{options.map((option) => <label key={option.value}><input type="radio" name={name} value={option.value} checked={value === option.value} onChange={onChange} />{option.label}</label>)}</fieldset>;
}
