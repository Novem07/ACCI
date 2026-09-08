import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, FormField, LoadingState, Page, Select, TextInput } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatCurrency, formatDate, formatIdentifier } from '../../shared/format';
import { createInvoice, getCheckout } from './api';
import styles from './PaymentCheckoutPage.module.css';

export default function PaymentCheckoutPage() {
  const { maPDK } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [method, setMethod] = useState('Tiền mặt');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    getCheckout(maPDK, { signal: controller.signal }).then((result) => {
      setCheckout(result); setMethod(result.payment.paymentMethod || 'Tiền mặt'); setInvoiceDate(String(result.payment.invoiceDate || result.payment.registrationDate || '').slice(0, 10));
    }).catch((requestError) => { if (requestError.name !== 'AbortError') setError(getErrorMessage(requestError, 'Không thể tải thông tin thanh toán.')); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [maPDK]);
  async function submit(event) {
    event.preventDefault(); if (!checkout || checkout.payment.status === 'paid') return;
    setSubmitting(true); setError('');
    try {
      const invoice = await createInvoice(maPDK, { paymentMethod: method, invoiceDate });
      setCheckout((current) => ({ ...current, payment: { ...current.payment, ...invoice, invoiceId: invoice.invoiceId, status: 'paid' } }));
      setSuccess(`Thanh toán thành công. Hóa đơn ${invoice.invoiceId} đã được tạo.`);
    } catch (requestError) { setError(getErrorMessage(requestError, 'Không thể xác nhận thanh toán.')); } finally { setSubmitting(false); }
  }
  if (loading) return <Page title="Xử lý thanh toán"><LoadingState label="Đang tải checkout…" /></Page>;
  if (!checkout) return <Page title="Xử lý thanh toán"><Alert tone="danger">{error || 'Không tìm thấy phiếu đăng ký.'}</Alert><Button type="button" variant="secondary" onClick={() => navigate('/ketoan')}>Quay lại</Button></Page>;
  const { payment, quote } = checkout; const paid = payment.status === 'paid';
  return <Page title="Xử lý thanh toán" description={`Phiếu ${formatIdentifier(payment.registrationId)} — ${formatIdentifier(payment.customerName)}`}>
    {error && <Alert tone="danger">{error}</Alert>}{success && <Alert tone="success">{success}</Alert>}
    <div className={styles.grid}><Card><h2>Thông tin đăng ký</h2><dl><dt>Khách hàng</dt><dd>{formatIdentifier(payment.customerName)}</dd><dt>Ngày đăng ký</dt><dd>{formatDate(payment.registrationDate)}</dd><dt>Số thí sinh</dt><dd>{quote.candidateCount ?? '—'}</dd></dl></Card><Card><h2>Giá trị thanh toán</h2><dl><dt>Tạm tính</dt><dd>{formatCurrency(quote.baseAmount)}</dd><dt>Trợ giá</dt><dd>{formatCurrency(quote.discountAmount)}</dd><dt><strong>Tổng thanh toán</strong></dt><dd><strong>{formatCurrency(quote.totalAmount)}</strong></dd></dl></Card></div>
    <Card as="form" className={styles.form} onSubmit={submit}><h2>{paid ? 'Biên nhận thanh toán' : 'Xác nhận thanh toán'}</h2><div className={styles.fields}><FormField id="payment-method" label="Phương thức thanh toán"><Select value={method} disabled={paid} onChange={(event) => setMethod(event.target.value)}><option>Tiền mặt</option><option>Chuyển khoản</option><option>MOMO</option></Select></FormField><FormField id="invoice-date" label="Ngày lập hóa đơn" required><TextInput type="date" value={invoiceDate} disabled={paid} onChange={(event) => setInvoiceDate(event.target.value)} /></FormField></div>{paid && <p className={styles.receipt}>Hóa đơn: {formatIdentifier(payment.invoiceId)}</p>}<div className={styles.actions}><Button type="button" variant="secondary" onClick={() => navigate('/ketoan')}>Quay lại</Button><Button type="submit" loading={submitting} disabled={paid}>{paid ? 'Đã thanh toán' : 'Xác nhận thanh toán'}</Button></div></Card>
  </Page>;
}
