import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Download, Eye, Plus } from 'lucide-react';

export default function AddressCollectionApp() {
  const [view, setView] = useState('user');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL || '';

  const [formData, setFormData] = useState({
    sabun: '',
    name: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!SCRIPT_URL) {
      setError('Google Apps Script URL이 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(SCRIPT_URL);
      const result = await response.json();
      
      if (result.data && result.data.length > 1) {
        const processedData = result.data.slice(1).map((row, index) => ({
          id: index,
          sabun: row[0] || '',
          name: row[1] || '',
          receiverName: row[2] || '',
          receiverPhone: row[3] || '',
          receiverAddress: row[4] || ''
        }));
        setData(processedData);
      }
      setError('');
    } catch (err) {
      setError('데이터 로드 실패: ' + err.message);
    }
    setLoading(false);
  };

  const saveDataToSheet = async (newEntry) => {
    if (!SCRIPT_URL) {
      alert('Google Apps Script URL이 설정되지 않았습니다.');
      return false;
    }

    try {
      const payload = {
        action: 'add',
        sabun: newEntry.sabun,
        name: newEntry.name,
        receiverName: newEntry.receiverName,
        receiverPhone: newEntry.receiverPhone,
        receiverAddress: newEntry.receiverAddress
      };

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        setError('');
        return true;
      }
    } catch (err) {
      setError('저장 실패: ' + err.message);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sabun || !formData.name || !formData.receiverName || !formData.receiverPhone || !formData.receiverAddress) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    const success = await saveDataToSheet(formData);
    
    if (success) {
      setFormData({
        sabun: '',
        name: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: ''
      });
      alert('주소가 등록되었습니다.');
      await loadData();
    }
    setLoading(false);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
      setPassword('');
      setView('admin');
      loadData();
    } else {
      alert('비밀번호가 잘못되었습니다.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('user');
    setPassword('');
  };

  const handleDownload = () => {
    if (data.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    const headers = ['사번', '이름', '수령인이름', '수령인 전화번호', '수령인 주소'];
    const rows = data.map(item => [
      item.sabun,
      item.name,
      item.receiverName,
      item.receiverPhone,
      item.receiverAddress
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `주소_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error && view === 'user') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '500px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>⚠️ 설정 오류</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>{error}</p>
          <p style={{ fontSize: '13px', color: '#374151' }}>✅ Vercel Settings → Environment Variables에서 REACT_APP_SCRIPT_URL을 추가하고 Redeploy하세요.</p>
        </div>
      </div>
    );
  }

  if (view === 'user') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10 }}>
          <button
            onClick={() => setView('admin')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={16} /> 관리자
          </button>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 20px 40px' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>배송/배달 주소 등록</h1>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>필요한 정보를 입력하고 제출해주세요.</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>사번 *</label>
                <input
                  type="text"
                  value={formData.sabun}
                  onChange={(e) => setFormData({ ...formData, sabun: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="예: A001"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="예: 김철수"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>수령인이름 *</label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="예: 이영희"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>수령인 전화번호 *</label>
                <input
                  type="tel"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="예: 010-1234-5678"
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>수령인 주소 *</label>
                <textarea
                  value={formData.receiverAddress}
                  onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="예: 서울시 강남구 테헤란로 123, 456호"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#cbd5e1' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '등록 중...' : '✓ 주소 등록'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', margin: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '8px', textAlign: 'center' }}>관리자 로그인</h1>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px', textAlign: 'center' }}>비밀번호: admin123</p>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="비밀번호 입력"
                autoFocus
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              로그인
            </button>

            <button
              type="button"
              onClick={() => setView('user')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              돌아가기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', margin: 0 }}>관리자 대시보드</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={16} /> 로그아웃
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '10px 16px',
              backgroundColor: showPreview ? '#1e40af' : '#f1f5f9',
              color: showPreview ? 'white' : '#1e293b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} /> {showPreview ? '표로 보기' : '목록으로 보기'}
          </button>

          <button
            onClick={handleDownload}
            style={{
              padding: '10px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={16} /> CSV 다운로드
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 새로고침
          </button>
        </div>

        <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>등록된 주소: <span style={{ fontWeight: '700', color: '#1e40af', fontSize: '18px' }}>{data.length}건</span></p>
        </div>

        {data.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>등록된 주소가 없습니다.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {showPreview ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e40af' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>사번</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>이름</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>수령인이름</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>전화번호</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.sabun}</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.name}</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.receiverName}</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.receiverPhone}</td>
                        <td style={{ padding: '12px', color: '#1e293b' }}>{item.receiverAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                {data.map((item) => (
                  <div key={item.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <p><strong>사번:</strong> {item.sabun}</p>
                    <p><strong>이름:</strong> {item.name}</p>
                    <p><strong>수령인:</strong> {item.receiverName}</p>
                    <p><strong>전화:</strong> {item.receiverPhone}</p>
                    <p><strong>주소:</strong> {item.receiverAddress}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
