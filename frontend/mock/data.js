/*
 * Mock data Montrack.
 * Format 100% meniru respons backend Google Apps Script:
 *   { success: true, data: ... } / { success: false, message: "..." }
 * Dimuat oleh js/services/api.js saat USE_MOCK = true.
 */
(function () {
  function iso(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  window.MOCK_DATA = {
    users: [
      { id: 'u-001', email: 'ayu@montrack.id', name: 'Ayu Pratama' },
    ],
    categories: [
      { id: 'c-01', name: 'Makanan', icon: '🍔' },
      { id: 'c-02', name: 'Transport', icon: '🚗' },
      { id: 'c-03', name: 'Belanja', icon: '🛍️' },
      { id: 'c-04', name: 'Tagihan', icon: '📄' },
      { id: 'c-05', name: 'Hiburan', icon: '🎬' },
      { id: 'c-06', name: 'Kesehatan', icon: '🏥' },
      { id: 'c-07', name: 'Pendidikan', icon: '📚' },
      { id: 'c-08', name: 'Gaji', icon: '💼' },
      { id: 'c-09', name: 'Freelance', icon: '🧑‍💻' },
      { id: 'c-10', name: 'Lainnya', icon: '➕' },
    ],
    transactions: [
      { id: 't-001', userId: 'u-001', date: iso(-6), type: 'in', category: 'Gaji', amount: 8500000, note: 'Gaji bulanan' },
      { id: 't-002', userId: 'u-001', date: iso(-6), type: 'out', category: 'Tagihan', amount: 350000, note: 'Internet bulanan' },
      { id: 't-003', userId: 'u-001', date: iso(-5), type: 'out', category: 'Makanan', amount: 65000, note: 'Makan siang kantor' },
      { id: 't-004', userId: 'u-001', date: iso(-5), type: 'out', category: 'Transport', amount: 25000, note: 'Bensin' },
      { id: 't-005', userId: 'u-001', date: iso(-4), type: 'out', category: 'Belanja', amount: 320000, note: 'Belanja mingguan' },
      { id: 't-006', userId: 'u-001', date: iso(-4), type: 'out', category: 'Hiburan', amount: 120000, note: 'Nonton bioskop' },
      { id: 't-007', userId: 'u-001', date: iso(-3), type: 'in', category: 'Freelance', amount: 1500000, note: 'Proyek desain' },
      { id: 't-008', userId: 'u-001', date: iso(-3), type: 'out', category: 'Makanan', amount: 45000, note: 'Kopi & croissant' },
      { id: 't-009', userId: 'u-001', date: iso(-2), type: 'out', category: 'Kesehatan', amount: 150000, note: 'Vitamin' },
      { id: 't-010', userId: 'u-001', date: iso(-2), type: 'out', category: 'Transport', amount: 18000, note: 'Ojek online' },
      { id: 't-011', userId: 'u-001', date: iso(-1), type: 'out', category: 'Makanan', amount: 80000, note: 'Makan malam keluarga' },
      { id: 't-012', userId: 'u-001', date: iso(-1), type: 'out', category: 'Belanja', amount: 95000, note: 'Pulpen & buku' },
      { id: 't-013', userId: 'u-001', date: iso(0), type: 'out', category: 'Makanan', amount: 50000, note: 'Makan siang' },
      { id: 't-014', userId: 'u-001', date: iso(0), type: 'out', category: 'Transport', amount: 12000, note: 'Parkir' },
      { id: 't-015', userId: 'u-001', date: iso(0), type: 'in', category: 'Lainnya', amount: 250000, note: 'Refund tiket' },
      { id: 't-016', userId: 'u-001', date: iso(-9), type: 'out', category: 'Tagihan', amount: 420000, note: 'Listrik PLN' },
      { id: 't-017', userId: 'u-001', date: iso(-11), type: 'out', category: 'Pendidikan', amount: 275000, note: 'Kursus online' },
      { id: 't-018', userId: 'u-001', date: iso(-13), type: 'out', category: 'Makanan', amount: 310000, note: 'Belanja bahan makanan' },
      { id: 't-019', userId: 'u-001', date: iso(-15), type: 'in', category: 'Freelance', amount: 850000, note: 'Jasa fotografi' },
      { id: 't-020', userId: 'u-001', date: iso(-16), type: 'out', category: 'Transport', amount: 64000, note: 'Tol & parkir' },
      { id: 't-021', userId: 'u-001', date: iso(-18), type: 'out', category: 'Hiburan', amount: 99000, note: 'Langganan musik' },
      { id: 't-022', userId: 'u-001', date: iso(-20), type: 'out', category: 'Kesehatan', amount: 210000, note: 'Cek darah' },
      { id: 't-023', userId: 'u-001', date: iso(-22), type: 'out', category: 'Belanja', amount: 175000, note: 'Sepatu olahraga' },
    ],
  };
})();
