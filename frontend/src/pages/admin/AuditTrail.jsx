import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Shield, Search, Filter, ChevronLeft, ChevronRight,
  RefreshCw, User, Globe, Clock, Activity, X, Calendar
} from 'lucide-react';
import adminService from '../../services/adminService';

/**
 * Badge color mapping for audit action labels.
 * Provides a distinct visual identity for each action category.
 */
const ACTION_COLORS = {
  login:               { bg: 'rgba(0, 230, 118, 0.12)', color: '#00e676', border: 'rgba(0, 230, 118, 0.25)' },
  logout:              { bg: 'rgba(255, 180, 0, 0.12)',  color: '#ffb400', border: 'rgba(255, 180, 0, 0.25)' },
  password_changed:    { bg: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', border: 'rgba(167, 139, 250, 0.25)' },
  student_created:     { bg: 'rgba(92, 124, 250, 0.12)',  color: '#7b93ff', border: 'rgba(92, 124, 250, 0.25)' },
  student_updated:     { bg: 'rgba(0, 242, 254, 0.12)',   color: '#00f2fe', border: 'rgba(0, 242, 254, 0.25)' },
  student_deleted:     { bg: 'rgba(255, 75, 75, 0.12)',   color: '#ff4b4b', border: 'rgba(255, 75, 75, 0.25)' },
  user_created:        { bg: 'rgba(92, 124, 250, 0.12)',  color: '#7b93ff', border: 'rgba(92, 124, 250, 0.25)' },
  user_updated:        { bg: 'rgba(0, 242, 254, 0.12)',   color: '#00f2fe', border: 'rgba(0, 242, 254, 0.25)' },
  grade_updated:       { bg: 'rgba(244, 114, 182, 0.12)', color: '#f472b6', border: 'rgba(244, 114, 182, 0.25)' },
  results_published:   { bg: 'rgba(0, 230, 118, 0.12)',   color: '#00e676', border: 'rgba(0, 230, 118, 0.25)' },
  results_unpublished: { bg: 'rgba(255, 75, 75, 0.12)',   color: '#ff4b4b', border: 'rgba(255, 75, 75, 0.25)' },
};

const DEFAULT_BADGE = { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
  const [loading, setLoading] = useState(true);
  const [actionOptions, setActionOptions] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    date_from: '',
    date_to: '',
    page: 1,
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  // Fetch distinct action labels for the dropdown
  useEffect(() => {
    const loadActions = async () => {
      try {
        const data = await adminService.getAuditActions();
        setActionOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load audit actions:', err);
      }
    };
    loadActions();
  }, []);

  // Fetch logs whenever filters change
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 25 };
      if (filters.search) params.search = filters.search;
      if (filters.action) params.action = filters.action;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      params.page = filters.page;

      const res = await adminService.getAuditLogs(params);
      setLogs(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        per_page: res.per_page || 25,
      });
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounce search input by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', action: '', date_from: '', date_to: '', page: 1 });
  };

  const hasActiveFilters = filters.search || filters.action || filters.date_from || filters.date_to;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadge = (action) => {
    const style = ACTION_COLORS[action] || DEFAULT_BADGE;
    return (
      <span style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">

      {/* Page Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px hsla(var(--primary), 0.3)'
            }}>
              <Shield size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800' }}>System Audit Trail</h1>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                {pagination.total} event{pagination.total !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input
              type="text"
              placeholder="Search by description, action, or user..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '13px', height: '38px' }}
            />
          </div>

          {/* Action Filter */}
          <div style={{ flex: '0 0 180px', position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '13px', height: '38px', appearance: 'auto' }}
            >
              <option value="">All Actions</option>
              {actionOptions.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div style={{ flex: '0 0 160px', position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '13px', height: '38px' }}
              title="From date"
            />
          </div>

          {/* Date To */}
          <div style={{ flex: '0 0 160px', position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '13px', height: '38px' }}
              title="To date"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                background: 'rgba(255, 75, 75, 0.1)', color: '#ff4b4b',
                border: '1px solid rgba(255, 75, 75, 0.2)', cursor: 'pointer',
              }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="page-loading" style={{ padding: '60px 0' }}>
            <span className="spinner"></span>
            <p>Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Activity size={48} color="hsl(var(--text-secondary))" style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'hsl(var(--text-secondary))' }}>
              No audit entries found
            </p>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', opacity: 0.7, marginTop: '4px' }}>
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Audit events will appear here as system activity occurs.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '140px' }}>Action</th>
                  <th>Description</th>
                  <th style={{ width: '150px' }}>User</th>
                  <th style={{ width: '120px' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="hsl(var(--text-secondary))" />
                        <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{log.description}</span>
                    </td>
                    <td>
                      {log.user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '8px',
                            background: 'rgba(92, 124, 250, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: '800', color: '#7b93ff',
                          }}>
                            {log.user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600' }}>{log.user.name}</div>
                            <div style={{ fontSize: '10px', color: 'hsl(var(--text-secondary))', textTransform: 'capitalize' }}>
                              {log.user.role?.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', fontStyle: 'italic' }}>System</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Globe size={12} color="hsl(var(--text-secondary))" />
                        <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', fontFamily: 'monospace' }}>
                          {log.ip_address || '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderTop: '1px solid var(--border-dark)',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1}–
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                  border: '1px solid var(--border-dark)',
                  background: pagination.current_page <= 1 ? 'transparent' : 'rgba(92, 124, 250, 0.08)',
                  color: pagination.current_page <= 1 ? 'hsl(var(--text-secondary))' : '#7b93ff',
                  opacity: pagination.current_page <= 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page number buttons */}
              {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                let page;
                if (pagination.last_page <= 5) {
                  page = i + 1;
                } else if (pagination.current_page <= 3) {
                  page = i + 1;
                } else if (pagination.current_page >= pagination.last_page - 2) {
                  page = pagination.last_page - 4 + i;
                } else {
                  page = pagination.current_page - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '700',
                      border: page === pagination.current_page ? '1px solid #7b93ff' : '1px solid var(--border-dark)',
                      background: page === pagination.current_page ? 'rgba(92, 124, 250, 0.15)' : 'transparent',
                      color: page === pagination.current_page ? '#7b93ff' : 'hsl(var(--text-secondary))',
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                  border: '1px solid var(--border-dark)',
                  background: pagination.current_page >= pagination.last_page ? 'transparent' : 'rgba(92, 124, 250, 0.08)',
                  color: pagination.current_page >= pagination.last_page ? 'hsl(var(--text-secondary))' : '#7b93ff',
                  opacity: pagination.current_page >= pagination.last_page ? 0.4 : 1,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
