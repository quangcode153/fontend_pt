import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ContractModal — Modal Hợp đồng thuê phòng trọ
 * 
 * Props:
 *   role: 'TENANT' | 'LANDLORD' — ai đang mở modal này
 *   - TENANT (khách thuê): chỉ được ký ô Bên B, ô Bên A bị khóa
 *   - LANDLORD (chủ trọ): chỉ được ký ô Bên A, ô Bên B đã ký sẵn & bị khóa
 */
export default function ContractModal({
  isOpen,
  onClose,
  phong,
  chuTroInfo,
  khachThueInfo,
  onConfirm,
  confirmText = "",
  isProcessing = false,
  role = 'TENANT',
  hopDong,
}) {
  const { t } = useTranslation();
  const [kyTenA, setKyTenA] = useState('');
  const [kyTenB, setKyTenB] = useState('');
  const [ngayBatDau, setNgayBatDau] = useState('');
  const [ngayKetThuc, setNgayKetThuc] = useState('');
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (isOpen) {
      const landlordName = chuTroInfo?.hoTen || chuTroInfo?.username || '';
      const tenantName = khachThueInfo?.hoTen || khachThueInfo?.username || '';

      // Nếu không có hàm onConfirm (chỉ xem) hoặc là Landlord xem HĐ đã duyệt
      if (!onConfirm) {
        setKyTenA(landlordName);
        setKyTenB(tenantName);
      } else {
        // Chế độ đang ký
        if (role === 'TENANT') {
          setKyTenA(landlordName);
          setKyTenB('');
        } else {
          setKyTenA('');
          setKyTenB(tenantName);
        }
      }

      // Khởi tạo ngày bắt đầu và kết thúc
      if (hopDong) {
        setNgayBatDau(hopDong.ngayBatDau || '');
        setNgayKetThuc(hopDong.ngayKetThuc || '');
      } else {
        setNgayBatDau(new Date().toISOString().split('T')[0]);
        setNgayKetThuc('');
      }
    }
  }, [isOpen, chuTroInfo, khachThueInfo, role, onConfirm, hopDong]);

  if (!isOpen) return null;

  const today = new Date();
  const dots = t('contract.dots');

  const inputBase = {
    width: '100%', marginTop: '8px', padding: '8px 12px',
    border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px',
    fontFamily: 'inherit', color: '#333', boxSizing: 'border-box',
    outline: 'none', textAlign: 'center', fontStyle: 'italic',
  };
  const inputActive = { ...inputBase, background: '#fff', border: '1.5px solid #93C5FD' };
  const inputLocked = { ...inputBase, background: '#E5E7EB', color: '#6B7280', cursor: 'not-allowed' };

  const isAEditable = role === 'LANDLORD' && !!onConfirm;
  const isBEditable = role === 'TENANT' && !!onConfirm;
  const canConfirm = kyTenA.trim().length > 0 && kyTenB.trim().length > 0;
  
  // Rút ngắn dots nếu dài quá
  const safeDots = ".....................";

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#fff', width: '100%', maxWidth: '650px',
        maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '40px',
        color: '#333'
      }} id="contract-printable">
        {/* Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{t('contract.republic')}</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', textDecoration: 'underline', marginBottom: '20px' }}>{t('contract.motto')}</div>
          <h2 style={{ margin: '0', fontSize: '22px' }}>{t('contract.title')}</h2>
          <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '10px' }}>
            {t('contract.today_text', { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() })}
          </div>
        </div>

        {/* Bên A */}
        <div style={{ marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px' }}>{t('contract.party_a')}</div>
          <div>{t('contract.mr_ms')} <strong>{chuTroInfo?.hoTen || chuTroInfo?.username || safeDots}</strong></div>
          <div>{t('contract.phone')} {chuTroInfo?.soDienThoai || safeDots}</div>
        </div>

        {/* Bên B */}
        <div style={{ marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px' }}>{t('contract.party_b')}</div>
          <div>{t('contract.mr_ms')} <strong>{khachThueInfo?.hoTen || khachThueInfo?.username || safeDots}</strong></div>
          <div>{t('contract.id_card')} {khachThueInfo?.soCccd || safeDots}</div>
          <div>{t('contract.phone')} {khachThueInfo?.soDienThoai || safeDots}</div>
        </div>

        {/* Điều 1 */}
        <div style={{ marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{t('contract.article_1')}</div>
          <div>{t('contract.article_1_content')} <strong>{phong?.tenPhong}</strong></div>
          <div>{t('contract.address')} {phong?.diaChi || safeDots}</div>
          <div>{t('contract.area')} {phong?.dienTich || '.....'} m²</div>
        </div>

        {/* Điều 2 */}
        <div style={{ marginBottom: '20px', lineHeight: '1.8', fontSize: '14px' }}>
          <strong>{t('contract.article_2')}</strong>
          <div>- {t('contract.rent_price')} <strong style={{ color: '#2563EB' }}>{phong?.giaPhong?.toLocaleString() || 0} {t('landlord.unit_vnd') || 'VND'}/{t('landlord.month').toLowerCase()}</strong></div>
          <div>- {t('contract.deposit')} <strong style={{ color: '#D97706' }}>{phong?.tienCoc?.toLocaleString() || 0} {t('landlord.unit_vnd') || 'VND'}</strong></div>
          <div>- {t('contract.electric_price')} {phong?.giaDien ? `${phong.giaDien.toLocaleString()} ${t('landlord.unit_kwh')}` : dots}</div>
          <div>- {t('contract.water_price')} {phong?.giaNuoc ? `${phong.giaNuoc.toLocaleString()} ${t('landlord.unit_m3')}` : dots}</div>
          
          {/* Thời hạn hợp đồng - Nhập liệu/Hiển thị động */}
          <div style={{ marginTop: '12px', padding: '14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#1E293B', fontSize: '13px' }}>📅 Thời hạn hợp đồng thuê trọ:</span>
            {onConfirm ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Ngày bắt đầu:</label>
                  <input
                    type="date"
                    value={ngayBatDau}
                    onChange={e => isBEditable && setNgayBatDau(e.target.value)}
                    disabled={!isBEditable}
                    style={isBEditable ? inputActive : inputLocked}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Ngày kết thúc:</label>
                  <input
                    type="date"
                    value={ngayKetThuc}
                    onChange={e => (isBEditable || isAEditable) && setNgayKetThuc(e.target.value)}
                    disabled={!(isBEditable || isAEditable)}
                    style={(isBEditable || isAEditable) ? inputActive : inputLocked}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><strong>Ngày bắt đầu:</strong> {ngayBatDau || '—'}</div>
                <div><strong>Ngày kết thúc:</strong> {ngayKetThuc || 'Hợp đồng vô thời hạn'}</div>
                <div style={{ gridColumn: '1 / -1', marginTop: '6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>🔒 Hạn hợp đồng đã được khóa sau khi hai bên ký kết thành công.</div>
              </div>
            )}
          </div>
        </div>

        {/* Điều 3 */}
        <div style={{ marginBottom: '32px', lineHeight: '1.8', fontSize: '14px' }}>
          <strong>{t('contract.article_3')}</strong>
          <div>- {t('contract.responsibility_1')}</div>
          <div>- {t('contract.responsibility_2')}</div>
          <div>- {t('contract.responsibility_3')}</div>
        </div>

        {/* ===== Phần KÝ TÊN ===== */}
        <div style={{
          padding: '20px', marginBottom: '20px',
          background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px',
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '18px', color: '#0369A1' }}>
            ✍️ {t('contract.sign_title')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Bên A */}
            <div style={{
              textAlign: 'center', padding: '18px 14px',
              border: `1px dashed ${isAEditable ? '#3B82F6' : '#D1D5DB'}`,
              borderRadius: '10px',
              background: isAEditable ? '#fff' : '#F3F4F6',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>{t('contract.party_a_rep')}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px', fontStyle: 'italic' }}>{t('contract.party_a_desc')}</div>
              <input
                type="text"
                placeholder={isAEditable ? t('contract.sign_placeholder') : ''}
                value={kyTenA}
                onChange={e => isAEditable && setKyTenA(e.target.value)}
                readOnly={!isAEditable}
                disabled={!isAEditable}
                style={isAEditable ? inputActive : inputLocked}
              />
              {kyTenA.trim() && (
                <div style={{
                  marginTop: '14px', fontSize: '16px', fontStyle: 'italic',
                  color: '#1D4ED8', fontFamily: 'Georgia, cursive',
                  borderBottom: '1.5px solid #1D4ED8',
                  paddingBottom: '4px', letterSpacing: '1px',
                }}>{kyTenA}</div>
              )}
              {!isAEditable && kyTenA.trim() && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>🔒 {t('contract.signed')}</div>
              )}
              {!isAEditable && !kyTenA.trim() && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>{t('contract.waiting_a')}</div>
              )}
            </div>

            {/* Bên B */}
            <div style={{
              textAlign: 'center', padding: '18px 14px',
              border: `1px dashed ${isBEditable ? '#3B82F6' : '#D1D5DB'}`,
              borderRadius: '10px',
              background: isBEditable ? '#fff' : '#F3F4F6',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>{t('contract.party_b_rep')}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px', fontStyle: 'italic' }}>{t('contract.party_b_desc')}</div>
              <input
                type="text"
                placeholder={isBEditable ? t('contract.sign_placeholder') : ''}
                value={kyTenB}
                onChange={e => isBEditable && setKyTenB(e.target.value)}
                readOnly={!isBEditable}
                disabled={!isBEditable}
                style={isBEditable ? inputActive : inputLocked}
              />
              {kyTenB.trim() && (
                <div style={{
                  marginTop: '14px', fontSize: '16px', fontStyle: 'italic',
                  color: '#1D4ED8', fontFamily: 'Georgia, cursive',
                  borderBottom: '1.5px solid #1D4ED8',
                  paddingBottom: '4px', letterSpacing: '1px',
                }}>{kyTenB}</div>
              )}
              {!isBEditable && kyTenB.trim() && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>🔒 {t('contract.signed')}</div>
              )}
              {!isBEditable && !kyTenB.trim() && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>{t('contract.waiting_b')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Cảnh báo */}
        {!canConfirm && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px', background: '#FEF3C7',
            border: '1px solid #FCD34D', borderRadius: '8px',
            fontSize: '13px', color: '#92400E', textAlign: 'center',
          }}>
            ⚠️ {role === 'TENANT' ? t('contract.warning_tenant') : t('contract.warning_landlord')}
          </div>
        )}

        {/* Nút bấm */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }} className="no-print">
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 22px', border: '1px solid var(--accent)',
              borderRadius: '8px', background: 'var(--accent-light)',
              color: 'var(--accent)',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              marginRight: 'auto'
            }}>
            🖨️ {t('landlord.btn_print')}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '10px 22px', border: '1px solid #D1D5DB',
              borderRadius: '8px', background: '#F9FAFB',
              cursor: 'pointer', fontWeight: 500, fontSize: '14px'
            }}>
            {t('contract.btn_cancel')}
          </button>
          {onConfirm && (
            <button
              onClick={() => onConfirm({ ngayBatDau, ngayKetThuc, kyTenA, kyTenB })}
              disabled={isProcessing || !canConfirm}
              style={{
                padding: '10px 22px', border: 'none', borderRadius: '8px',
                background: canConfirm ? '#2563EB' : '#9CA3AF',
                color: '#fff',
                cursor: canConfirm && !isProcessing ? 'pointer' : 'not-allowed',
                fontWeight: 'bold', fontSize: '14px',
                transition: 'background 0.2s',
              }}>
              {isProcessing ? `⏳ ${t('contract.btn_processing')}` : `✅ ${confirmText || t('contract.btn_cancel')}`}
            </button>
          )}
        </div>

        {/* CSS for Printing */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #contract-printable, #contract-printable * {
              visibility: visible;
            }
            #contract-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              box-shadow: none;
              overflow: visible;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
