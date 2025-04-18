import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import api from '../api';
import './ScanDetailsPage.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ScanDetailsPage = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchScanDetails = async () => {
    setLoading(true);
    try {
      const scanResponse = await api.get(`/scans/${id}`);
      setScan(scanResponse.data);

      const vulnerabilitiesResponse = await api.get(`/scans/${id}/vulnerabilities?page=${currentPage}`);
      setVulnerabilities(vulnerabilitiesResponse.data.vulnerabilities);
      setTotalPages(Math.ceil(vulnerabilitiesResponse.data.total / 10));
    } catch (error) {
      console.error('Error fetching scan details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanDetails();
  }, [id, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleReScan = async () => {
    try {
      await api.post(`/scans/${id}/rescan`);
      fetchScanDetails();
    } catch (error) {
      console.error('Error rescanning:', error);
    }
  };

  if (loading || !scan) {
    return <div className="loading">Загрузка...</div>;
  }

  // Prepare chart data
  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [
      {
        data: [
          scan.stats?.critical || 0,
          scan.stats?.high || 0,
          scan.stats?.medium || 0,
          scan.stats?.low || 0,
          scan.stats?.info || 0,
        ],
        backgroundColor: [
          '#d32f2f',
          '#f57c00',
          '#ffa000',
          '#7cb342',
          '#3f51b5',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
    cutout: '70%',
  };

  return (
    <div className="scan-details-page">
      <div className="page-header">
        <h1>Анализ уязвимостей адреса - {scan.address}</h1>
        <button className="recheck-button" onClick={handleReScan}>
          Перепроверить уязвимости адреса
        </button>
      </div>

      <div className="scan-details-container">
        <div className="vulnerabilities-table-container">
          <div className="vulnerabilities-table">
            <div className="vulnerabilities-table-header">
              <div className="header-cell number">
                <span>Номер</span>
                <i className="fas fa-sort"></i>
              </div>
              <div className="header-cell priority">
                <span>Приоритетность уязвимостей</span>
                <i className="fas fa-sort"></i>
              </div>
              <div className="header-cell name">
                <span>Имя</span>
              </div>
              <div className="header-cell family">
                <span>Семейство</span>
                <i className="fas fa-sort"></i>
              </div>
              <div className="header-cell count">
                <span>Кол-во</span>
                <i className="fas fa-sort"></i>
              </div>
            </div>

            <div className="vulnerabilities-table-body">
              {vulnerabilities.map((vulnerability, index) => (
                <div key={vulnerability.id} className="vulnerability-row">
                  <div className="cell number">{(currentPage - 1) * 10 + index + 1}</div>
                  <div className="cell priority">
                    <div className={`priority-badge ${vulnerability.priority.toLowerCase()}`}>
                      {vulnerability.priority}
                    </div>
                  </div>
                  <div className="cell name">{vulnerability.name}</div>
                  <div className="cell family">{vulnerability.family}</div>
                  <div className="cell count">{vulnerability.count}</div>
                </div>
              ))}
              {vulnerabilities.length === 0 && (
                <div className="no-vulnerabilities">Уязвимостей не найдено</div>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <div className="page-info">
                1-10 от {scan.vulnerabilitiesCount} уязвимостей
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

        <div className="scan-summary">
          <div className="summary-title">Детали анализа</div>
          <div className="summary-content">
            <div className="summary-item">
              <div className="summary-label">Наименование</div>
              <div className="summary-value">{scan.address}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Статус</div>
              <div className="summary-value">{scan.status}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Запустили</div>
              <div className="summary-value">{scan.startTime}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Анализ закончен</div>
              <div className="summary-value">{scan.endTime}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Анализ длился</div>
              <div className="summary-value">{scan.duration}</div>
            </div>
          </div>

          <div className="summary-title vulnerabilities-title">Уязвимости</div>
          <div className="chart-container">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanDetailsPage;