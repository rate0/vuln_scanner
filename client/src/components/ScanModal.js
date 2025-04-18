import React, { useState } from 'react';
import './ScanModal.css';

const ScanModal = ({ onSubmit, onClose }) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!address) {
      setError('Пожалуйста, введите адрес для проверки');
      return;
    }

    onSubmit(address);
  };

  return (
    <div className="modal-overlay">
      <div className="scan-modal">
        <div className="modal-header">
          <h3>Проверить уязвимость</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="address">Адрес для проверки</label>
            <div className="info-icon">ⓘ</div>
            <input
              type="text"
              id="address"
              placeholder="192.168.0.1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Отменить
          </button>
          <button className="primary-button" onClick={handleSubmit}>
            Начать проверку
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanModal;