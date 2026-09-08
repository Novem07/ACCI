import React from 'react';
import Page from '../layout/Page';
import styles from './feedback.module.css';

export default function UnavailableModule({ title, description }) {
  return <Page title={title}>
    <section className={styles.empty} aria-labelledby="unavailable-title">
      <h2 id="unavailable-title">Chức năng đang được hoàn thiện</h2>
      <p>{description}</p>
    </section>
  </Page>;
}
