import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ProcessRegister.css';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const ProcessRegister = () => {
  const { maPDK } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/payments/${maPDK}`), api.get(`/payments/${maPDK}/quote`)])
      .then(([paymentResult, quoteResult]) => {
        setPayment(paymentResult.payment);
        setQuote(quoteResult.quote);
        if (paymentResult.payment?.paymentMethod) setPaymentMethod(paymentResult.payment.paymentMethod);
        if (paymentResult.payment?.invoiceDate) setInvoiceDate(String(paymentResult.payment.invoiceDate).slice(0, 10));
      })
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải thông tin thanh toán.')))
      .finally(() => setLoading(false));
  }, [maPDK]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/payments/${maPDK}/invoices`, { paymentMethod, invoiceDate });
      navigate('/ketoan');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo hóa đơn.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><p>Đang tải thông tin thanh toán...</p></AppShell>;
  if (!quote || !payment) return <div className="page-wrapper"><p role="alert">{error || 'Không tìm thấy phiếu đăng ký.'}</p><button type="button" onClick={() => navigate('/ketoan')}>Quay lại</button></div>;

  return (
    <AppShell>
      <main className="invoice-wrapper">
        <form className="invoice" onSubmit={handleSubmit}>
          <h1>ACCI</h1>
          <h2>Hóa đơn đăng ký</h2>
          <p><span>Mã phiếu đăng ký:</span><span>{quote.registrationId}</span></p>
          <p><span>Khách hàng:</span><span>{quote.customerName}</span></p>
          <p><span>Số điện thoại:</span><span>{quote.customerPhone}</span></p>
          <p><span>Số thí sinh:</span><span>{quote.candidateCount}</span></p>
          <p><span>Tạm tính:</span><span>{money(quote.baseAmount)}</span></p>
          <p><span>Trợ giá ({Math.round(quote.discountRate * 100)}%):</span><span>{money(quote.discountAmount)}</span></p>
          <hr />
          <p><strong>Tổng tiền:</strong><strong>{money(quote.totalAmount)}</strong></p>
          <label>
            Phương thức thanh toán
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="Tiền mặt">Tiền mặt</option>
              <option value="Chuyển khoản">Chuyển khoản</option>
              <option value="MOMO">MOMO</option>
            </select>
          </label>
          <label>
            Ngày lập hóa đơn
            <input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} required />
          </label>
          {error && <p role="alert" className="form-error">{error}</p>}
          {payment.invoiceId && <p role="status">Phiếu đã có hóa đơn {payment.invoiceId}.</p>}
          <div className="payment-actions">
            <button className="btn cancel" type="button" onClick={() => navigate('/ketoan')}>Hủy</button>
            <button className="btn confirm" type="submit" disabled={submitting || Boolean(payment.invoiceId)}>
              {submitting ? 'Đang lưu...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
};

export default ProcessRegister;
