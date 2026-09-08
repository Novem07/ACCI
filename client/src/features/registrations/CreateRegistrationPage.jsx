import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, LoadingState, Page } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { PATHS } from '../../app/routes';
import { useUnsavedChanges } from '../../app/UnsavedChangesContext';
import { createCustomer, listCustomers } from '../customers/api';
import { createRegistration, listCertificates } from './api';
import CandidateEditor from './components/CandidateEditor';
import CandidateTable from './components/CandidateTable';
import CustomerForm from './components/CustomerForm';
import CustomerSelector from './components/CustomerSelector';
import RegistrationSummary from './components/RegistrationSummary';
import styles from './CreateRegistrationPage.module.css';

export default function CreateRegistrationPage() {
  const navigate = useNavigate();
  const { setDirty } = useUnsavedChanges();
  const [customers, setCustomers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [customerDraft, setCustomerDraft] = useState(false);
  const [candidateDraft, setCandidateDraft] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([listCustomers({}, { signal: controller.signal }), listCertificates({ signal: controller.signal })])
      .then(([customerPage, certificateItems]) => {
        setCustomers(customerPage.items);
        setCertificates(certificateItems);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(getErrorMessage(requestError, 'Không thể tải dữ liệu lập phiếu.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const certificatesById = useMemo(() => Object.fromEntries(certificates.map((certificate) => [certificate.id, certificate])), [certificates]);
  const dirty = Boolean(selectedCustomerId || candidates.length || editingCandidate || customerDraft || candidateDraft);

  useEffect(() => {
    if (!dirty) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);

  async function handleCreateCustomer(input) {
    setCreatingCustomer(true);
    setError('');
    try {
      const customer = await createCustomer(input);
      setCustomers((current) => [...current, customer]);
      setSelectedCustomerId(customer.id);
      setNotice(`Đã thêm và chọn khách hàng ${customer.id}.`);
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể thêm khách hàng.'));
      return false;
    } finally {
      setCreatingCustomer(false);
    }
  }

  function saveCandidate(candidate) {
    setCandidates((current) => {
      const exists = current.some((item) => item.clientId === candidate.clientId);
      return exists ? current.map((item) => item.clientId === candidate.clientId ? candidate : item) : [...current, candidate];
    });
    setEditingCandidate(null);
    setError('');
  }

  async function submitRegistration() {
    if (!selectedCustomerId) {
      setError('Hãy chọn hoặc thêm một khách hàng trước khi tạo phiếu.');
      return;
    }
    if (candidates.length === 0) {
      setError('Hãy thêm ít nhất một thí sinh trước khi tạo phiếu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createRegistration({
        customerId: selectedCustomerId,
        candidates: candidates.map(({ clientId, ...candidate }) => candidate),
      });
      navigate(PATHS.registrations);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo phiếu đăng ký.'));
    } finally {
      setSubmitting(false);
    }
  }

  function cancel() {
    if (!dirty || window.confirm('Các thay đổi chưa lưu sẽ bị mất. Bạn muốn rời trang?')) navigate(PATHS.registrations);
  }

  if (loading) return <Page title="Lập phiếu đăng ký"><LoadingState label="Đang chuẩn bị biểu mẫu…" /></Page>;

  return <Page title="Lập phiếu đăng ký" description="Chọn khách hàng, thêm thí sinh, sau đó kiểm tra lại trước khi tạo phiếu.">
    {error && <Alert tone="danger">{error}</Alert>}
    {notice && <Alert tone="success">{notice}</Alert>}
    <div className={styles.stack}>
      <Card><CustomerSelector customers={customers} value={selectedCustomerId} onChange={setSelectedCustomerId} /></Card>
      <Card><CustomerForm onCreate={handleCreateCustomer} onDirtyChange={setCustomerDraft} loading={creatingCustomer} /></Card>
      <Card><CandidateEditor certificates={certificates} initialValue={editingCandidate} onSave={saveCandidate} onCancel={() => setEditingCandidate(null)} onDirtyChange={setCandidateDraft} /></Card>
      <Card><h2>Danh sách thí sinh</h2><CandidateTable candidates={candidates} certificatesById={certificatesById} onEdit={setEditingCandidate} onRemove={(clientId) => setCandidates((current) => current.filter((candidate) => candidate.clientId !== clientId))} /></Card>
    </div>
    <RegistrationSummary customer={selectedCustomer} candidateCount={candidates.length} submitting={submitting} onSubmit={submitRegistration} onCancel={cancel} />
  </Page>;
}
