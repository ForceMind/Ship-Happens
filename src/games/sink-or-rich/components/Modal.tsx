import React from 'react';
import styles from './styles.module.css';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const Modal: React.FC<Props> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 style={{ color: '#f6d365', marginBottom: '15px' }}>{title}</h3>
        <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {onCancel && <button className={styles.btnSecondary} onClick={onCancel}>取消</button>}
          <button className={styles.btnPrimary} onClick={onConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
};
