import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, LoadingState, Page, RadioGroup } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../shared/format';
import { createExtension, getExtensionOptions } from './api';
import styles from './CreateExtensionPage.module.css';

const reasonLabels = {
  CURRENT_SCHEDULE: 'Lịch hiện tại',
  SCHEDULE_FULL: 'Đã hết chỗ',
  EXTENSION_WINDOW_CLOSED: 'Còn dưới 24 giờ',
};

export default function CreateExtensionPage() {
  const { maPhieu: examFormId } = useParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [caseType, setCaseType] = useState('Thường');
  const [scheduleId, setScheduleId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError('');

    getExtensionOptions(examFormId, { signal: controller.signal })
      .then(setOptions)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(getErrorMessage(requestError));
      });

    return () => controller.abort();
  }, [examFormId]);

  async function submit(event) {
    event.preventDefault();
    if (!scheduleId) {
      setError('Hãy chọn một lịch thi đủ điều kiện.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createExtension({ examFormId, caseType, newScheduleId: scheduleId });
      navigate('/giahan');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!options) {
    return <Page title="Gia hạn chứng chỉ">
      {error ? <Alert tone="danger">{error}</Alert> : <LoadingState label="Đang tải lịch thi…" />}
    </Page>;
  }

  return <Page title="Gia hạn chứng chỉ" description={`Phiếu dự thi ${examFormId}`}>
    <form onSubmit={submit} className={styles.form}>
      {error && <Alert tone="danger">{error}</Alert>}
      <Card>
        <h2>Lịch thi hiện tại</h2>
        <p>{formatDate(options.currentSchedule?.examDate)} · {options.currentSchedule?.examTime} · {options.currentSchedule?.scheduleId}</p>
      </Card>
      <Card>
        <h2>Trường hợp gia hạn</h2>
        <RadioGroup
          label="Loại yêu cầu"
          name="caseType"
          value={caseType}
          onChange={(event) => setCaseType(event.target.value)}
          options={[
            { value: 'Thường', label: 'Thường' },
            { value: 'Đặc biệt', label: 'Đặc biệt' },
          ]}
        />
      </Card>
      <Card>
        <h2>Chọn lịch thi mới</h2>
        <div className={styles.scheduleOptions} role="radiogroup" aria-label="Lịch thi mới">
          {(options.schedules || []).map((item) => <label key={item.scheduleId} className={styles.scheduleOption}>
            <input
              type="radio"
              name="schedule"
              value={item.scheduleId}
              checked={scheduleId === item.scheduleId}
              disabled={!item.eligibility.allowed}
              onChange={() => setScheduleId(item.scheduleId)}
            />
            <span>
              <strong>{item.scheduleId}</strong> — {formatDate(item.examDate)} {item.examTime} · còn {item.remainingSeats} chỗ
              {!item.eligibility.allowed && ` (${reasonLabels[item.eligibility.reason] || 'Không đủ điều kiện'})`}
            </span>
          </label>)}
        </div>
      </Card>
      <div className={styles.actions}><Button type="submit" loading={submitting}>Gửi yêu cầu gia hạn</Button></div>
    </form>
  </Page>;
}
