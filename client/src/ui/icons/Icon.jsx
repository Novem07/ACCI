import React from 'react';

const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  file: 'M14 2H5v20h14V7z M14 2v5h5 M8 12h8 M8 16h6',
  plus: 'M12 5v14 M5 12h14',
  clock: 'M12 8v4l3 2 M21 12a9 9 0 1 1-9-9',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  moon: 'M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13z',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  search: 'm21 21-4.35-4.35 M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
  close: 'M6 6l12 12 M18 6 6 18',
};

export default function Icon({ name = 'file', size = 20, decorative = true, title }) {
  const accessible = !decorative;
  return <svg data-testid={`icon-${name}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden={decorative || undefined} role={accessible ? 'img' : undefined} aria-label={accessible ? title : undefined}><path d={paths[name] || paths.file} /></svg>;
}
