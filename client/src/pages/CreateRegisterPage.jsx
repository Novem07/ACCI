import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRegisterPage.css';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';

const emptyCustomer = {
  fullName: '',
  organization: '',
  citizenId: '',
  phone: '',
  email: '',
  address: '',
};

const emptyCandidate = {
  fullName: '',
  certificateId: '',
  citizenId: '',
  phone: '',
  email: '',
  address: '',
};

function CreateRegisterPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customer, setCustomer] = useState(emptyCustomer);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/customers'), api.get('/catalog/certificates')])
      .then(([customerResult, certificateResult]) => {
        if (!active) return;
        setCustomers(customerResult.customers || []);
        setCertificates(certificateResult.certificates || []);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, 'Không thể tải dữ liệu đăng ký.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedCertificate = useMemo(
    () => certificates.find((item) => item.id === candidate.certificateId),
    [certificates, candidate.certificateId],
  );

  const handleCustomerChange = (event) => {
    const id = event.target.value;
    setSelectedCustomerId(id);
    const selected = customers.find((item) => item.MaKhachHang === id || item.id === id);
    if (selected) {
      setCustomer({
        fullName: selected.HoTen || selected.fullName || '',
        organization: selected.DonVi || selected.organization || '',
        citizenId: selected.CCCD || selected.citizenId || '',
        phone: selected.SDT || selected.phone || '',
        email: selected.Email || selected.email || '',
        address: selected.DiaChi || selected.address || '',
      });
    }
  };

  const handleCustomerSubmit = async (event) => {
    event.preventDefault();
    setCustomerMessage('');
    try {
      const result = await api.post('/customers', customer);
      const created = result.customer;
      setCustomers((current) => [...current, created]);
      setSelectedCustomerId(created.id);
      setCustomerMessage(`Đã thêm khách hàng ${created.id}.`);
    } catch (requestError) {
      setCustomerMessage(getErrorMessage(requestError, 'Không thể thêm khách hàng.'));
    }
  };

  const handleCandidateSubmit = (event) => {
    event.preventDefault();
    if (!candidate.certificateId) {
      setError('Vui lòng chọn chứng chỉ cho thí sinh.');
      return;
    }
    setCandidates((current) => [...current, candidate]);
    setCandidate(emptyCandidate);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCustomerId) {
      setError('Vui lòng chọn hoặc thêm khách hàng.');
      return;
    }
    if (candidates.length === 0) {
      setError('Vui lòng thêm ít nhất một thí sinh.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/registrations', {
        customerId: selectedCustomerId,
        registrationDate: new Date().toISOString().slice(0, 10),
        candidates,
      });
      navigate('/tiepnhan');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo phiếu đăng ký.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-wrapper"><p>Đang tải dữ liệu...</p></div>;

  return (
    <AppShell>
      <main className="form-container">
        <h2>Tạo phiếu đăng ký mới</h2>
        {error && <p role="alert" className="form-error">{error}</p>}

        <form className="form-section" onSubmit={handleCustomerSubmit}>
          <h4>Thông tin khách hàng</h4>
          <label htmlFor="customer-select">Khách hàng đã có</label>
          <select id="customer-select" value={selectedCustomerId} onChange={handleCustomerChange}>
            <option value="">-- Chọn mã khách hàng --</option>
            {customers.map((item) => (
              <option key={item.MaKhachHang || item.id} value={item.MaKhachHang || item.id}>
                {item.MaKhachHang || item.id} - {item.HoTen || item.fullName}
              </option>
            ))}
          </select>
          <div className="input-row">
            <input required placeholder="Họ tên khách hàng" value={customer.fullName} onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })} />
            <input required placeholder="Đơn vị hoặc Không" value={customer.organization} onChange={(event) => setCustomer({ ...customer, organization: event.target.value })} />
          </div>
          <div className="input-row">
            <input placeholder="CCCD" value={customer.citizenId} onChange={(event) => setCustomer({ ...customer, citizenId: event.target.value })} />
            <input required placeholder="SĐT" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
            <input required type="email" placeholder="Email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
          </div>
          <input required placeholder="Địa chỉ" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} />
          <button className="btn btn-black" type="submit">Thêm khách hàng</button>
          {customerMessage && <p role="status">{customerMessage}</p>}
        </form>

        <form className="form-section" onSubmit={handleCandidateSubmit}>
          <h4>Thông tin thí sinh</h4>
          <div className="input-row">
            <input required placeholder="Họ tên thí sinh" value={candidate.fullName} onChange={(event) => setCandidate({ ...candidate, fullName: event.target.value })} />
            <select required value={candidate.certificateId} onChange={(event) => setCandidate({ ...candidate, certificateId: event.target.value })}>
              <option value="">-- Chọn chứng chỉ --</option>
              {certificates.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
            </select>
          </div>
          <div className="input-row">
            <input required placeholder="CCCD" value={candidate.citizenId} onChange={(event) => setCandidate({ ...candidate, citizenId: event.target.value })} />
            <input required placeholder="SĐT" value={candidate.phone} onChange={(event) => setCandidate({ ...candidate, phone: event.target.value })} />
            <input required type="email" placeholder="Email" value={candidate.email} onChange={(event) => setCandidate({ ...candidate, email: event.target.value })} />
          </div>
          <input required placeholder="Địa chỉ" value={candidate.address} onChange={(event) => setCandidate({ ...candidate, address: event.target.value })} />
          {selectedCertificate && <small>Chứng chỉ: {selectedCertificate.name}</small>}
          <button className="btn btn-blue" type="submit">Thêm thí sinh</button>
        </form>

        <section className="form-section" aria-labelledby="candidate-list-title">
          <h4 id="candidate-list-title">Danh sách thí sinh ({candidates.length})</h4>
          {candidates.length === 0 ? <p>Chưa có thí sinh nào.</p> : (
            <ul>
              {candidates.map((item, index) => (
                <li key={`${item.citizenId}-${index}`}>
                  {item.fullName} — {certificates.find((certificate) => certificate.id === item.certificateId)?.name || item.certificateId}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="button-group">
          <button className="btn btn-red" type="button" onClick={() => navigate('/tiepnhan')}>Hủy</button>
          <button className="btn btn-green" type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Đang tạo...' : 'Tạo phiếu'}
          </button>
        </div>
      </main>
    </AppShell>
  );
}

export default CreateRegisterPage;
