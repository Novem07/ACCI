import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Card, LoadingState, Page } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../shared/format';
import { getExamForm } from './api';

export default function ExamFormDetailPage() { const { id } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState(''); useEffect(() => { const c = new AbortController(); getExamForm(id, { signal: c.signal }).then(setItem).catch((e) => { if (e.name !== 'AbortError') setError(getErrorMessage(e)); }); return () => c.abort(); }, [id]); if (!item && !error) return <Page title="Phiếu dự thi"><LoadingState /></Page>; if (error) return <Page title="Phiếu dự thi"><Alert tone="danger">{error}</Alert></Page>; return <Page title="Phiếu dự thi" description={item.examFormId}><Card><dl><dt>Mã thí sinh</dt><dd>{item.candidateId}</dd><dt>Chứng chỉ</dt><dd>{item.certificateName}</dd><dt>Ngày thi</dt><dd>{formatDate(item.examDate)} {item.examTime}</dd><dt>Trạng thái</dt><dd>{item.status}</dd></dl></Card><Link to="/phieuduthi">Quay lại danh sách</Link></Page>; }
