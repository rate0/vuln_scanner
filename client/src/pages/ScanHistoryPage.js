import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ScanModal from '../components/ScanModal';
import './ScanHistoryPage.css';

const ScanHistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchScans = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/scans?page=${page}&search=${searchTerm}`);
      setScans(response.data.scans);
      setTotalPages(Math.ceil(response.data.total / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [searchTerm]);

  const handleStartScan = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleScanSubmit = async (address) => {
    try {
      await api.post('/scans', { address });
      fetchScans();
      setShowModal(false);
    } catch (error) {
      console.error('Error starting scan:', error);
    }
  };

  const handleReScan = async (id) => {
    try {
      await api.post(`/scans/${id}/rescan`);
      fetchScans();
    } catch (error) {
      console.error('Error rescanning:', error);
    }
  };

  const handleDeleteScan = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await api.delete(`/scans/${id}`);
        fetchScans();
      } catch (error) {
        console.error('Error deleting scan:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchScans(page);
  };

  return (
    <div className="scan-history-page">
      <div className="page-header">
        <h1>История анализа уязвимостей</h1>
        <button className="check-vulnerability-button" onClick={handleStartScan}>
          Проверить уязвимость
        </button>
      </div>

      <div className="scan-table-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </div>

        <div className="scan-table">
          <div className="scan-table-header">
            <div className="header-cell date">
              <span>Дата проверки</span>
              <i className="fas fa-sort"></i>
            </div>
            <div className="header-cell address">
              <span>Проверенный адрес</span>
            </div>
            <div className="header-cell checked-by">
              <span>Проверено кем</span>
              <i className="fas fa-sort"></i>
            </div>
            <div className="header-cell count">
              <span>Количество уязвимостей</span>
              <i className="fas fa-sort"></i>
            </div>
            <div className="header-cell priority">
              <span>Приоритетность уязвимостей</span>
            </div>
            <div className="header-cell actions">
              <span>Действия</span>
            </div>
          </div>

          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div className="scan-table-body">
              {scans.map((scan) => (
                <div key={scan.id} className="scan-row">
                  <div className="cell date">{scan.date}</div>
                  <div className="cell address">{scan.address}</div>
                  <div className="cell checked-by">{scan.checkedBy}</div>
                  <div className="cell count">{scan.vulnerabilitiesCount}</div>
                  <div className="cell priority">
                    <div className="priority-indicators">
                      {scan.priorities.map((priority) => (
                        <div
                          key={priority.level}
                          className={`priority-indicator priority-${priority.level}`}
                        >
                          {priority.count}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="cell actions">
                    <button
                      className="action-button recheck"
                      onClick={() => handleReScan(scan.id)}
                    >
                      Перепроверить
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteScan(scan.id)}
                    >
                      Удалить запись
                    </button>
                    <Link
                      to={`/scan/${scan.id}`}
                      className="action-button view"
                    >
                      См. анализ
                    </Link>
                  </div>
                </div>
              ))}
              {scans.length === 0 && (
                <div className="no-scans">Нет данных для отображения</div>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="page-info">
              1-10 от 100 анализов
            </div>
            <div className="page-controls">
              <button
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {currentPage > 3 && <span className="page-ellipsis">...</span>}
              
              {Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
                .filter(page => page > 1 && page < totalPages)
                .map(page => (
                  <button
                    key={page}
                    className={`page-button ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))
              }
              
              {currentPage < totalPages - 2 && <span className="page-ellipsis">...</span>}
              <button
                className="page-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
              <button
                className="page-button next"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div className="page-size-selector">
              10/page
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ScanModal onSubmit={handleScanSubmit} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ScanHistoryPage;