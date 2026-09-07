import React from 'react';
import styles from './BrandLogo.module.css';

const sources = {
  full: '/brand/acci-logo-horizontal.svg',
  mark: '/brand/acci-mark.svg',
  mono: '/brand/acci-logo-mono.svg',
};

export default function BrandLogo({ compact = false, monochrome = false, className = '', decorative = false }) {
  const src = monochrome ? sources.mono : compact ? sources.mark : sources.full;
  const classes = `${styles.logo} ${compact ? styles.compact : ''} ${className}`.trim();

  return (
    <img
      data-testid="brand-logo"
      className={classes}
      src={src}
      alt={decorative ? '' : 'ACCI Center'}
      aria-hidden={decorative || undefined}
    />
  );
}
