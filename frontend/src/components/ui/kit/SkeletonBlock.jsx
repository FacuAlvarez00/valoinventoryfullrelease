import React from 'react';
import styles from './SkeletonBlock.module.css';

export default function SkeletonBlock({ width = '100%', height = 16, radius, style, className = '' }) {
  return (
    <div
      className={`${styles.block} ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
