import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, LoadingState, Page, RadioGroup } from '../../ui';
import { api, getErrorMessage } from '../../api/client';
import { formatDate } from '../../shared/format';

const reasons = { CURRENT_SCHEDULE: 'Lịch hiện tại', SCHEDULE_FULL: 'Đã hết chỗ', EXTENSION_WINDOW_CLOSED: 'Còn dưới 24 giờ' };

export default function CreateExtensionPage() {
  const { maPhieu } = useParams(); const navigate = useNavigate();
  const [options, setOptions] = useState(null); const [caseType, setCaseType] = useState('Thường'); const [scheduleId, setScheduleId] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { const controller = new AbortController(); api.get(`/extensions/${maPhieu}/extension-options`, { signal: controller.signal }).then(setOptions).catch((err) => { if (err.name !== 'AbortError') setError(getErrorMessage(err)); }); return () => controller.abort(); }, [maPhieu]);
  async function submit(event) { event.preventDefault(); if (!scheduleId) { setError('Hãy chọn một lịch thi đủ điều kiện.'); return; } setSubmitting(true); setError(''); try { await api.post('/extensions', { examFormId: maPhieu, caseType, newScheduleId: scheduleId }); navigate('/giahan'); } catch (err) { setError(getErrorMessage(err)); } finally { setSubmitting(false); } }
  if (!options) return <Page title="Gia hạn chứng chỉ"><LoadingState label="Đang tải lịch thi…" /></Page>;
  return <Page title="Gia hạn chứng chỉ" description={`Phiếu dự thi ${maPhieu}`}><form onSubmit={submit}>{error && <Alert tone="danger">{error}</Alert>}<Card><h2>Lịch thi hiện tại</h2><p>{formatDate(options.currentSchedule?.examDate)} · {options.currentSchedule?.examTime} · {options.currentSchedule?.scheduleId}</p></Card><Card><h2>Trường hợp gia hạn</h2><RadioGroup name="caseType" value={caseType} onChange={(event) => setCaseType(event.target.value)} options={[{ value: 'Thường', label: 'Thường' }, { value: 'Đặc biệt', label: 'Đặc biệt' }]} /></Card><Card><h2>Chọn lịch thi mới</h2><div role="radiogroup" aria-label="Lịch thi mới">{options.schedules.map((item) => <label key={item.scheduleId}><input type="radio" name="schedule" value={item.scheduleId} checked={scheduleId === item.scheduleId} disabled={!item.eligibility.allowed} onChange={() => setScheduleId(item.scheduleId)} /> {item.scheduleId} — {formatDate(item.examDate)} {item.examTime} · còn {item.remainingSeats} chỗ {!item.eligibility.allowed && `(${reasons[item.eligibility.reason]})`}</label>)}</div></Card><Button type="submit" loading={submitting}>Gửi yêu cầu gia hạn</Button></form></Page>;
}
