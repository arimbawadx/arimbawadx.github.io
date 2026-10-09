// =============================================================
// KONFIGURASI API DAN PWA (BASE V1 + PATCHES)
// =============================================================
const GAS_URL = "MASUKKAN_URL_WEB_APP_ANDA_DISINI";

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js'); }

async function apiGet(action, params = "") {
  let res = await fetch(`${GAS_URL}?action=${action}${params}`);
  return await res.json();
}
async function apiPost(action, payload) {
  let res = await fetch(`${GAS_URL}?action=${action}`, { method: 'POST', body: JSON.stringify(payload) });
  return await res.json();
}

function applyVendorTheme(c) {
  if(!c || !c.appName) return;
  document.title = c.appName;
  document.querySelectorAll('.brand b').forEach(el => el.innerText = c.appName);
  if(c.appIcon) {
    document.getElementById('sideLogo').src = c.appIcon;
    document.getElementById('dynamic-favicon').href = c.appIcon;
  }
  const root = document.documentElement;
  root.style.setProperty('--c5', c.colorPrimary); root.style.setProperty('--c1', c.colorLight); root.style.setProperty('--c7', c.colorDark); root.style.setProperty('--bs-primary', c.colorPrimary);
}

// =============================================================
// LOGIKA APLIKASI
// =============================================================
var TOKO = { nama: 'ERP POS', alamat: 'Terima Kasih Atas Kunjungan Anda', telp: '' };
var Q = "'", db = { produk: [], booking: [], member: [], akuntansi: [], transaksi: [] }, cart = [], syncing = false, syncQueue = [], curTab = 'pos', SC = null, toastT = null;
try { syncQueue = JSON.parse(localStorage.getItem('erpSyncQueue_v8')) || []; } catch(e){}

function g(id) { return document.getElementById(id); }
function formatRp(n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function genId(p) { return p + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
function oc(fn, id) { return 'onclick="' + fn + '(' + Q + esc(id) + Q + ')"'; }
function namaTampil(p) { return String(p).indexOf('Guest') === 0 ? 'Guest' : String(p); }
function normWA(v) { var n = String(v||'').replace(/\D/g,''); if (n.charAt(0)==='0') n='62'+n.slice(1); else if (n.charAt(0)==='8') n='62'+n; return (n.length>=10)?n:''; }
function toast(msg) { var t = g('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(()=>t.style.display='none', 4000); }
function showM(id) { bootstrap.Modal.getOrCreateInstance(g(id)).show(); }
function hideM(id) { var m = bootstrap.Modal.getInstance(g(id)); if (m) m.hide(); }
function lockScreen(on) { g('saasLockScreen').style.display = on ? 'flex' : 'none'; }
function saveQ() { try { localStorage.setItem('erpSyncQueue_v8', JSON.stringify(syncQueue)); } catch(e){} }
function setSyncUI(k) { var m = { ok: ['text-success','Synced'], pend: ['text-warning','Pending'], sync: ['text-primary','Syncing'], fail: ['text-danger','Gagal'], off: ['text-danger','Offline'] }[k]; g('syncStatus').innerHTML = `<i class="fa-solid fa-circle ${m[0]} me-1" style="font-size:.55rem"></i>${m[1]}`; }

async function initApp() {
  setSyncUI(syncQueue.length ? 'pend' : 'ok'); gantiJenisJurnal();
  try {
    let s = await apiGet('getInitialData');
    if (s.vendorConfig) {
      applyVendorTheme(s.vendorConfig); TOKO.nama = s.vendorConfig.appName;
      g('admAppName').value = s.vendorConfig.appName; g('admAppIcon').value = s.vendorConfig.appIcon; g('admColorPrimary').value = s.vendorConfig.colorPrimary; g('admColorLight').value = s.vendorConfig.colorLight; g('admColorDark').value = s.vendorConfig.colorDark;
    }
    if (s.license && s.license.isExpired) lockScreen(true);
    if (s.license && s.license.expiryDate) g('adminNewDate').value = String(s.license.expiryDate).split('T')[0];
    
    // PATCH: Tambahan index untuk kolom baru di backend
    if(s.produk) db.produk = s.produk.map(r => ({ id: String(r[0]), nama: String(r[1]), kategori: String(r[2]), harga: Number(r[3])||0, ket: String(r[5]||'') }));
    if(s.booking) db.booking = s.booking.map(r => ({ id: String(r[0]), waktu: r[1], pelanggan: String(r[2]), layanan: String(r[3]), status: r[4] }));
    if(s.member) db.member = s.member.map(r => ({ id: String(r[0]), nama: String(r[1]), hp: String(r[2]), level: String(r[3]), status: String(r[5]||'Aktif') }));
    if(s.transaksi) db.transaksi = s.transaksi.map(r => ({ id: String(r[0]), tgl: r[1], pelanggan: String(r[2]), total: Number(r[3])||0, metode: r[4], status: r[5], detail: String(r[6]), log: r[7] }));
    if(s.akuntansi) db.akuntansi = s.akuntansi.map(r => ({ id: String(r[0]), tgl: r[1], tipe: r[2], ket: String(r[3]), debit: String(r[4]), kredit: String(r[5]), nominal: Number(r[6])||0 }));
    renderAll();
  } catch(e) { setSyncUI('off'); toast('Offline Mode'); renderAll(); }
}

function renderAll() { cariKatalog(); renderCart(); renderTabelProduk(); renderMember(); renderBooking(); renderLaporanAkuntansi(); renderRiwayatPOS(); }

// --- POS & CART ---
function cariKatalog() {
  var q = g('searchKatalog').value.toLowerCase();
  var h = db.produk.filter(p => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)).map(p => `<div class="col-6 col-sm-4 col-xl-3"><div class="pcard" ${oc('addToCart', p.id)}><small>${esc(p.kategori)}</small><h6>${esc(p.nama)}</h6><div class="hg">${formatRp(p.harga)}</div></div></div>`).join('');
  g('katalogContainer').innerHTML = h || '<p class="text-center text-muted py-5">Belum ada produk.</p>';
}
function addToCart(id) {
  var p = db.produk.find(x => x.id === id); if(!p) return;
  var e = cart.find(c => c.id === id); if(e) e.qty++; else cart.push({id: p.id, nama: p.nama, kategori: p.kategori, harga: p.harga, qty: 1});
  renderCart();
}
function kurangiItem(i) { if(cart[i].qty > 1) cart[i].qty--; else cart.splice(i,1); renderCart(); }

// PATCH: Guest Name Display Logic
function cekGuestPOS() {
    var isGuest = g('posPelanggan').value === "";
    g('posGuestName').style.display = isGuest ? 'block' : 'none';
}

function renderCart() {
  var total = 0, count = 0;
  var h = cart.map((c, i) => { total += c.harga*c.qty; count += c.qty; return `<div class="tint p-2 mb-2 d-flex justify-content-between align-items-center"><div class="flex-grow-1 pe-2" style="min-width:0"><div class="fw-bold small">${esc(c.nama)}</div><div class="small fw-bold" style="color:var(--c5)">${formatRp(c.harga)}</div></div><div class="d-flex align-items-center bg-white border rounded-3"><button class="btn btn-sm" onclick="kurangiItem(${i})"><i class="fa-solid fa-minus"></i></button><span class="fw-bold px-1">${c.qty}</span><button class="btn btn-sm" ${oc('addToCart', c.id)}><i class="fa-solid fa-plus"></i></button></div></div>`; }).join('');
  g('cartItems').innerHTML = h || '<p class="text-center text-muted small mt-4">Pilih produk</p>';
  g('totalPrice').innerText = formatRp(total); g('cartCount').innerText = count + ' Item'; g('cartBarCount').innerText = count + ' Item'; g('cartBarTotal').innerText = formatRp(total);
  g('cartBar').style.display = (count > 0 && curTab === 'pos') ? 'flex' : 'none'; if(!count) toggleCart(false);
}
function toggleCart(open) { if(window.innerWidth>=992) return; var o = bootstrap.Offcanvas.getOrCreateInstance(g('cartPanel')); if(open) o.show(); else o.hide(); }

// PATCH: Booking loader supports items and cart accumulation
function loadBookingKeCart(idBk) {
  if(!idBk) { g('posRefBookingId').value = ''; return; }
  var bk = db.booking.find(b => b.id === idBk); if(!bk) return;
  // Coba cari apakah dia member
  var memberMatch = db.member.find(m => m.nama.toLowerCase() === bk.pelanggan.toLowerCase());
  if(memberMatch) { g('posPelanggan').value = memberMatch.id; cekGuestPOS(); } 
  else { g('posPelanggan').value = ""; cekGuestPOS(); g('posGuestName').value = bk.pelanggan; }
  
  g('posRefBookingId').value = bk.id;
  var p = db.produk.find(x => x.nama.toLowerCase() === String(bk.layanan).trim().toLowerCase()); 
  if(p && !cart.some(c=>c.id===p.id)) addToCart(p.id);
  toast('Antrean ditarik ke keranjang (Bisa tambah item lain)');
}

function prosesCheckout() {
  if(cart.length===0) { alert('Kosong!'); return; }
  var total = cart.reduce((s,i) => s + i.harga*i.qty, 0);
  
  // PATCH: Ambil nama dari input GUEST jika combo kosong
  var co = g('posPelanggan');
  var cust = co.value === "" ? (g('posGuestName').value || 'Guest') : co.options[co.selectedIndex].text;
  
  var method = g('metodeBayar').value, status = g('statusBayar').value, detail = cart.map(c => `${c.nama}(x${c.qty})`).join(', ');
  var tgl = new Date().toISOString(), idTx = genId('TX');
  var newTx = { id: idTx, tgl: tgl, pelanggan: cust, total: total, metode: method, status: status, detail: detail, log: '-' };
  db.transaksi.unshift(newTx); addToQueue('Transaksi', 'INSERT', null, [idTx, tgl, cust, total, method, status, detail, '-']);
  
  var idJr = genId('JR'), akunDebit = status === 'Lunas' ? 'Kas ' + method : 'Piutang Usaha', ket = 'Penjualan ['+idTx+'] - '+cust;
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: ket, debit: akunDebit, kredit: 'Pendapatan Jasa', nominal: total });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Otomatis POS', ket, akunDebit, 'Pendapatan Jasa', total]);
  
  var bkId = g('posRefBookingId').value; if(bkId) { var b = db.booking.find(x=>x.id===bkId); if(b) b.status='Selesai'; addToQueue('Booking', 'UPDATE_STATUS', bkId, null, { statusCol: 5, newStatus: 'Selesai' }); }
  cart = []; g('posPanggilBooking').value = ''; g('posRefBookingId').value = ''; g('posGuestName').value = ''; toggleCart(false); renderAll(); bukaStruk(newTx, 'STRUK PEMBAYARAN');
}

// --- RIWAYAT ---
function bukaRiwayatPOS() { renderRiwayatPOS(); showM('modalRiwayat'); }
function renderRiwayatPOS() {
  g('tabelRiwayatPOS').innerHTML = db.transaksi.map(tx => {
    var bg = tx.status === 'Lunas' ? 'bg-success-subtle text-success' : (tx.status === 'Batal' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis');
    var act = tx.status==='Belum Bayar' ? `<button class="btn btn-sm btn-primary" ${oc('lunasiPiutang', tx.id)}>Lunasi</button>` : (tx.status==='Lunas' ? `<button class="btn btn-sm btn-outline-danger" ${oc('batalTransaksi', tx.id)}>Void</button>` : '');
    return `<tr><td><div class="fw-bold">${esc(tx.id)}</div><div class="text-muted" style="font-size:.7rem">${new Date(tx.tgl).toLocaleDateString('id-ID')}</div></td><td><div class="fw-bold">${esc(tx.pelanggan)}</div><div class="text-muted text-truncate" style="font-size:.7rem;max-width:11rem">${esc(tx.detail)}</div></td><td class="fw-bold">${formatRp(tx.total)}</td><td><span class="badge ${bg}">${esc(tx.status)}</span></td><td class="text-center">${act} <button class="btn btn-sm btn-dark" ${oc('cetakStrukUlang', tx.id)}><i class="fa-solid fa-receipt"></i></button></td></tr>`;
  }).join('');
}
function findTx(id) { return db.transaksi.find(t => t.id === id); }
function lunasiPiutang(idTx) {
  if(!confirm('Konfirmasi pelunasan?')) return;
  var tx = findTx(idTx); if(!tx) return;
  tx.status = 'Lunas'; tx.log = 'Dilunasi pd ' + new Date().toLocaleDateString('id-ID');
  var idJr = genId('JR'), tgl = new Date().toISOString();
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: 'Pelunasan ['+idTx+']', debit: 'Kas '+tx.metode, kredit: 'Piutang Usaha', nominal: tx.total });
  addToQueue('Transaksi', 'UPDATE_STATUS', idTx, null, { statusCol: 6, newStatus: 'Lunas', auditCol: 8, auditText: tx.log });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Sistem', 'Pelunasan ['+idTx+']', 'Kas '+tx.metode, 'Piutang Usaha', tx.total]);
  renderAll();
}
function batalTransaksi(idTx) {
  var alasan = prompt('Alasan Void?'); if(!alasan) return;
  var tx = findTx(idTx); if(!tx) return;
  tx.status = 'Batal'; tx.log = 'VOID: ' + alasan;
  var idJr = genId('JR'), tgl = new Date().toISOString();
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: 'VOID ['+idTx+']', debit: 'Pendapatan Jasa', kredit: 'Kas '+tx.metode, nominal: tx.total });
  addToQueue('Transaksi', 'UPDATE_STATUS', idTx, null, { statusCol: 6, newStatus: 'Batal', auditCol: 8, auditText: tx.log });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Reversal', 'VOID ['+idTx+']', 'Pendapatan Jasa', 'Kas '+tx.metode, tx.total]);
  renderAll();
}

// --- STRUK (Murni Canvas) ---
function parseItems(d) { return String(d).split(', ').map(s => { var i = s.lastIndexOf('(x'); if(i>0 && s.endsWith(')')) { var q = parseInt(s.slice(i+2,-1),10); if(q>0) return {n:s.slice(0,i), q:q}; } return {n:s, q:1}; }); }
function cetakStrukUlang(id) { var t = findTx(id); if(t) { hideM('modalRiwayat'); setTimeout(()=>bukaStruk(t,'SALINAN STRUK'), 350); } }

// PATCH: Desain struk elegan vertikal
function drawStruk(tx, hd) {
  var W=400, L=30, R=W-30, CX=W/2, y=0;
  var items = parseItems(tx.detail);
  var H = 380 + (items.length * 30); // Dynamic height memanjang ke bawah
  
  var cc = document.createElement('canvas'); cc.width = W; cc.height = H;
  var c = cc.getContext('2d'); c.fillStyle='#fff'; c.fillRect(0,0,W,H);
  
  function txt(t,x,font,col,al='left') { c.font=font; c.fillStyle=col; c.textAlign=al; c.fillText(t,x,y); }
  function row(a,b,fb='13px sans-serif') { y+=24; txt(a,L,fb,'#2f1b11'); txt(b,R,fb,'#2f1b11','right'); }
  
  y=50; c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--c5'); c.beginPath(); c.arc(CX,y-8,24,0,7); c.fill();
  c.fillStyle='#fff'; c.textAlign='center'; c.font='bold 24px serif'; c.fillText(TOKO.nama.charAt(0).toUpperCase(), CX, y);
  y+=40; txt(TOKO.nama, CX, 'bold 22px serif', '#2f1b11', 'center');
  y+=20; txt(TOKO.alamat, CX, '12px sans-serif', '#8a7566', 'center');
  y+=30; txt(hd, CX, 'bold 14px sans-serif', '#5f3b25', 'center'); y+=10;
  
  row('No. Transaksi', tx.id); row('Tanggal', new Date(tx.tgl).toLocaleString('id-ID')); row('Pelanggan', namaTampil(tx.pelanggan)); row('Pembayaran', tx.metode);
  y+=20; c.beginPath(); c.moveTo(L,y); c.lineTo(R,y); c.strokeStyle='#ddd'; c.stroke(); y+=10;
  
  items.forEach(it => { row(it.n, 'x'+it.q, 'bold 14px sans-serif'); });
  
  y+=20; c.beginPath(); c.moveTo(L,y); c.lineTo(R,y); c.strokeStyle='#ddd'; c.stroke(); y+=10;
  y+=24; txt('TOTAL KESELURUHAN', L, 'bold 15px sans-serif', '#2f1b11'); txt(formatRp(tx.total), R, 'bold 18px serif', '#2f1b11', 'right');
  y+=40; txt(tx.status.toUpperCase(), CX, 'bold 16px sans-serif', tx.status==='Lunas'?'#047857':'#b91c1c', 'center');
  y+=40; txt('Terima kasih!', CX, 'italic 12px sans-serif', '#8a7566', 'center');
  
  return Promise.resolve(cc);
}

function bukaStruk(tx, hd) {
  var ctx = { tx: tx, hd: hd, cv: null }; SC = ctx;
  var m = db.member.find(x => x.nama === tx.pelanggan); g('strukWA').value = m?m.hp:'';
  g('strukImg').removeAttribute('src'); showM('modalStruk');
  drawStruk(tx,hd).then(cv => { if(SC===ctx) { ctx.cv=cv; g('strukImg').src=cv.toDataURL('image/jpeg',0.9); } });
}
function strukBlob() { return new Promise(r => SC.cv.toBlob(r, 'image/jpeg', 0.9)); }
function strukSimpan() {
  if(!SC || !SC.cv) return Promise.resolve();
  return strukBlob().then(b => {
    var a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='Struk-'+SC.tx.id+'.jpg';
    document.body.appendChild(a); a.click(); a.remove(); toast('JPG disimpan');
  });
}

// PATCH: WA Share yang lebih stabil tanpa API Share bawaan HP yg sering ngaco
function strukWA() {
  var no = normWA(g('strukWA').value); if(!no) { toast('Isi nomor WA valid'); return; }
  var text = `Halo, berikut struk kasir ${TOKO.nama} dengan ID Transaksi ${SC.tx.id} sebesar ${formatRp(SC.tx.total)}. Terima kasih!`;
  strukSimpan().then(()=> { window.open('https://wa.me/'+no+'?text='+encodeURIComponent(text),'_blank'); });
}

// --- BLUETOOTH THERMAL ---
var BT = { dev: null, ch: null };
async function btConnect() {
  if(BT.ch && BT.dev && BT.dev.gatt.connected) return BT.ch;
  if(!navigator.bluetooth) throw new Error('NOBT');
  let dev = await navigator.bluetooth.requestDevice({ acceptAllDevices:true, optionalServices:['000018f0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455'] });
  BT.dev = dev; let srv = await dev.gatt.connect(); let svs = await srv.getPrimaryServices();
  for(let s of svs) { let chs = await s.getCharacteristics(); for(let c of chs) { if(c.properties.write || c.properties.writeWithoutResponse) { BT.ch=c; return c; } } }
  throw new Error('Printer tidak valid');
}
async function btSend(ch, data) { for(let i=0; i<data.length; i+=100) { let p=Uint8Array.from(data.slice(i,i+100)); if(ch.properties.writeWithoutResponse) await ch.writeValueWithoutResponse(p); else await ch.writeValue(p); await new Promise(r=>setTimeout(r,40)); } }

// PATCH: Atasi masalah thermal printer terpotong angka akhirnya (3 digit)
function cleanRp(num) { return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function escPos(tx, hd) {
  var W=32, o=[]; 
  function raw(...a){o.push(...a);} function line(s){ for(let i=0;i<s.length;i++) o.push(s.charCodeAt(i)); o.push(10); } function sep(){line('--------------------------------');} function row(l,r){ l=String(l);r=String(r); l=l.slice(0,Math.max(1,W-r.length-1)); line(l+' '.repeat(W-l.length-r.length)+r); }
  raw(27,64, 27,97,1, 29,33,17); line(TOKO.nama); raw(29,33,0); line(hd); raw(27,97,0); sep();
  row('No', tx.id); row('Plg', namaTampil(tx.pelanggan)); sep();
  parseItems(tx.detail).forEach(i=>row(i.n, 'x'+i.q)); sep();
  
  // FIXED formatRp bug
  raw(27,69,1); row('TOTAL', 'Rp ' + cleanRp(tx.total)); raw(27,69,0); row('Status', tx.status); sep();
  
  raw(27,97,1); line('Terima kasih!'); raw(27,100,4, 29,86,66,0); return o;
}
function strukCetakBT() {
  if(!SC) return;
  btConnect().then(ch => btSend(ch, escPos(SC.tx, SC.hd))).then(() => toast('Mencetak...'))
  .catch(e => { if(e.name==='NotFoundError')return; alert('Koneksi printer gagal atau tidak didukung browser ini.'); });
}

// --- MASTER, BOOKING, CRM, AKUNTING ---

// PATCH CRM: Form Edit, Hapus, Card, Status Dinamis
function simpanMember(e) { 
    e.preventDefault(); 
    var idEdit = g('mIdValue').value, nm = g('mNama').value, hp = g('mHP').value, lvl = g('mLevel').value, st = g('mStatus').value; 
    if (idEdit) { 
        var i = db.member.findIndex(m=>m.id===idEdit); 
        if(i>-1) db.member[i] = {id:idEdit,nama:nm,hp:hp,level:lvl,status:st}; 
        addToQueue('Member','UPDATE',idEdit,[idEdit,nm,hp,lvl,'0',st]); 
    } else { 
        var id=genId('MB'); db.member.push({id:id,nama:nm,hp:hp,level:lvl,status:st}); 
        addToQueue('Member','INSERT',null,[id,nm,hp,lvl,'0',st]); 
    } 
    batalEditMember(); renderAll(); 
}
function editMember(id) { var m=db.member.find(x=>x.id===id); if(m){ g('mIdValue').value=m.id; g('mNama').value=m.nama; g('mHP').value=m.hp; g('mLevel').value=m.level; g('mStatus').value=m.status; g('btnSimpanM').innerText='Update'; g('btnBatalM').style.display='block'; window.scrollTo(0,0); } }
function batalEditMember() { g('formMember').reset(); g('mIdValue').value=''; g('btnSimpanM').innerText='Simpan'; g('btnBatalM').style.display='none'; }
function hapusMember(id) { if(confirm('Hapus Data Member?')) { db.member=db.member.filter(m=>m.id!==id); addToQueue('Member','DELETE',id,null); renderAll(); } }
function cetakIDCard(id) {
    var m = db.member.find(x=>x.id===id); if(!m) return;
    var d = g('pdfTarget');
    d.innerHTML = `<div style="width:340px;height:210px;background:#2f1b11;border-radius:15px;color:white;padding:20px;box-shadow:0 10px 20px rgba(0,0,0,0.2);position:relative;">
        <h2 style="margin:0;font-size:20px;color:#d9bda3;">${TOKO.nama}</h2>
        <div style="font-size:10px;opacity:0.8;margin-bottom:20px;">MEMBER CARD</div>
        <div style="font-size:18px;letter-spacing:2px;margin-bottom:10px;">${m.id}</div>
        <div style="font-size:22px;font-weight:bold;text-transform:uppercase;margin-bottom:5px;">${m.nama}</div>
        <div style="font-size:12px;color:#d9bda3;">Tipe: ${m.level.toUpperCase()}</div>
    </div>`;
    d.style.display = 'block';
    html2pdf(d, { margin: 5, filename: 'Kartu_'+m.nama+'.pdf', image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: [90, 60], orientation: 'landscape' } }).then(()=>d.style.display='none');
}
function renderMember() { 
    g('listMember').innerHTML = db.member.map(m => `<div class="col-sm-6 col-xl-4"><div class="tint p-3 d-flex align-items-center gap-3"><div class="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width:44px;height:44px;background:var(--c2);color:var(--c6)">${esc(m.nama.charAt(0))}</div><div class="flex-grow-1"><div class="fw-bold small">${esc(m.nama)}</div><div class="small text-muted mb-1">${esc(m.hp||'-')} - <b>${esc(m.level)}</b></div><span class="badge ${m.status==='Aktif'?'bg-success':(m.status==='Nonaktif'?'bg-warning':'bg-danger')}">${esc(m.status)}</span></div><div><button class="btn btn-sm text-primary py-0" ${oc('editMember',m.id)}><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm text-dark py-0" ${oc('cetakIDCard',m.id)}><i class="fa-solid fa-id-card"></i></button><button class="btn btn-sm text-danger py-0" ${oc('hapusMember',m.id)}><i class="fa-solid fa-trash"></i></button></div></div></div>`).join(''); 
    
    // Perbarui dropdown Guest & Member di POS
    var opt = '<option value="">-- Guest --</option>' + db.member.map(m => `<option value="${esc(m.id)}">${esc(m.nama)}</option>`).join(''); 
    g('posPelanggan').innerHTML = opt;
    
    // Perbarui datalist Pelanggan Booking
    g('listPelangganBooking').innerHTML = db.member.map(m => `<option value="${esc(m.nama)}">`).join('');
}

// PATCH BOOKING: Select Layanan, Edit, Hapus
function simpanBooking(e) { e.preventDefault(); var idEdit = g('bIdValue').value, wkt = g('bWaktu').value, plg = g('bPelanggan').value, lay = g('bLayanan').value; if(idEdit){ var i=db.booking.findIndex(b=>b.id===idEdit); if(i>-1) db.booking[i]={id:idEdit,waktu:wkt,pelanggan:plg,layanan:lay,status:'Menunggu'}; addToQueue('Booking','UPDATE',idEdit,[idEdit,wkt,plg,lay,'Menunggu']); } else { var id=genId('BK'); db.booking.push({id:id,waktu:wkt,pelanggan:plg,layanan:lay,status:'Menunggu'}); addToQueue('Booking','INSERT',null,[id,wkt,plg,lay,'Menunggu']); } batalEditBooking(); renderAll(); toast('Antrean Tersimpan'); }
function editBooking(id) { var b=db.booking.find(x=>x.id===id); if(b){ g('bIdValue').value=b.id; g('bWaktu').value=b.waktu; g('bPelanggan').value=b.pelanggan; g('bLayanan').value=b.layanan; g('btnSimpanB').innerText='Update'; g('btnBatalB').style.display='block'; window.scrollTo(0,0); } }
function hapusBooking(id) { if(confirm('Batalkan antrean ini?')){ db.booking=db.booking.filter(b=>b.id!==id); addToQueue('Booking','DELETE',id,null); renderAll(); } }
function batalEditBooking() { g('formBooking').reset(); g('bIdValue').value=''; g('btnSimpanB').innerText='Simpan'; g('btnBatalB').style.display='none'; }
function renderBooking() { 
    var act = db.booking.filter(b => b.status === 'Menunggu'); 
    g('posPanggilBooking').innerHTML = '<option value="">-- Pilih Antrean Aktif --</option>' + act.map(b => `<option value="${esc(b.id)}">${esc(b.pelanggan)}</option>`).join(''); 
    g('listBooking').innerHTML = act.map(b => `<div class="col-md-6"><div class="cardx p-3 border-start border-4 border-primary position-relative"><button class="btn btn-sm text-primary position-absolute top-0 end-0 mt-2 me-4" ${oc('editBooking',b.id)}><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm text-danger position-absolute top-0 end-0 m-2" ${oc('hapusBooking',b.id)}><i class="fa-solid fa-trash"></i></button><div class="fw-bold">${esc(b.pelanggan)}</div><div class="small fw-bold text-primary">${new Date(b.waktu).toLocaleString('id-ID')}</div><div class="small text-muted">${esc(b.layanan)}</div></div></div>`).join(''); 
    
    // Perbarui dropdown Layanan Booking berdasarkan produk
    g('bLayanan').innerHTML = '<option value="">-- Pilih Layanan Utama --</option>' + db.produk.map(p=>`<option value="${esc(p.nama)}">${esc(p.nama)} - ${formatRp(p.harga)}</option>`).join('');
}

// PATCH AKUNTING: Hapus Jurnal, Tutup Buku
function gantiJenisJurnal() { var j = g('jJenisKas').value, o = g('jAkunLawan'); if (j === 'Pengeluaran') o.innerHTML = '<option>Beban Listrik/Air</option><option>Beban Gaji</option><option>Pembelian Stok</option><option>Prive</option>'; else if (j === 'Pemasukan') o.innerHTML = '<option>Pendapatan Lain</option>'; else o.innerHTML = '<option>Modal Awal</option><option>Tambahan Modal</option>'; }
function simpanJurnalManual(e) { e.preventDefault(); var idEdit = g('jIdValue').value, tgl = g('jTgl').value, jenis = g('jJenisKas').value, akun = g('jAkunLawan').value, ket = g('jKet').value, nom = parseInt(g('jNominal').value,10); if(nom<=0)return; var deb = jenis==='Pengeluaran'?akun:'Kas Utama', kre = jenis==='Pengeluaran'?'Kas Utama':akun; 
    if(idEdit) { var i=db.akuntansi.findIndex(a=>a.id===idEdit); if(i>-1) db.akuntansi[i]={id:idEdit,tgl:tgl,ket:ket,debit:deb,kredit:kre,nominal:nom}; addToQueue('Akuntansi','UPDATE',idEdit,[idEdit,tgl,'Manual',ket,deb,kre,nom]); } 
    else { var idJr=genId('JM'); db.akuntansi.push({id:idJr,tgl:tgl,ket:ket,debit:deb,kredit:kre,nominal:nom}); addToQueue('Akuntansi','INSERT',null,[idJr,tgl,'Manual',ket,deb,kre,nom]); } 
    batalEditJurnal(); gantiJenisJurnal(); renderAll(); toast('Jurnal Disimpan'); 
}
function batalEditJurnal() { g('formJurnal').reset(); g('jIdValue').value=''; g('btnSimpanJ').innerText='Catat Jurnal'; g('btnBatalJ').style.display='none'; }
function hapusJurnal(id) { if(confirm('Hapus Jurnal?')){ db.akuntansi=db.akuntansi.filter(a=>a.id!==id); addToQueue('Akuntansi','DELETE',id,null); renderAll(); } }

var currentPD=0, currentBB=0;
function renderLaporanAkuntansi() { 
    var pd=0, bb=0, md=0; 
    g('tabelJurnal').innerHTML = db.akuntansi.slice().reverse().map(a => { 
        if(a.kredit.includes('Pendapatan')) pd+=a.nominal; if(a.debit.includes('Pendapatan')) pd-=a.nominal; 
        if(a.debit.includes('Beban')||a.debit.includes('Pembelian')) bb+=a.nominal; if(a.kredit.includes('Beban')) bb-=a.nominal;
        if(a.kredit.includes('Modal')) md+=a.nominal; if(a.debit.includes('Prive')) md-=a.nominal; 
        
        // Buat kode TX bisa diklik
        var ketRender = a.ket;
        var match = a.ket.match(/(TX[A-Z0-9]+)/);
        if(match) ketRender = a.ket.replace(match[1], `<a href="#" onclick="cetakStrukUlang('${match[1]}')"><b>${match[1]}</b></a>`);
        
        // Hapus hanya untuk JM (Manual) atau TB (Tutup Buku)
        var btn = a.id.startsWith('JM') || a.id.startsWith('TB') ? `<button class="btn btn-sm text-danger py-0" ${oc('hapusJurnal',a.id)}><i class="fa-solid fa-trash"></i></button>` : '';
        return `<tr><td>${new Date(a.tgl).toLocaleDateString('id-ID')}</td><td>${ketRender}</td><td>${esc(a.debit)}</td><td>${esc(a.kredit)}</td><td class="text-end fw-bold">${formatRp(a.nominal)}</td><td class="text-center">${btn}</td></tr>`; 
    }).join(''); 
    currentPD=pd; currentBB=bb;
    g('dashPendapatan').innerText=formatRp(pd); g('dashBeban').innerText=formatRp(bb); g('dashModal').innerText=formatRp(md); g('dashLaba').innerText=formatRp(pd-bb); 
}
function prosesTutupBuku() {
    if(!confirm('Anda yakin ingin TUTUP BUKU bulan ini? Pendapatan & Beban saat ini akan dipindah ke Modal (Nol kembali). Pastikan Anda sudah mencetak laporan bulan ini.')) return;
    if(currentPD === 0 && currentBB === 0) return alert('Tidak ada transaksi.');
    var laba = currentPD - currentBB; var tbRef = genId('TB'); var tgl = new Date().toISOString();
    
    var id1=genId('TB'); db.akuntansi.push({id:id1,tgl:tgl,ket:'Tutup Buku Pendapatan',debit:'Pendapatan Jasa',kredit:'Ikhtisar L/R',nominal:currentPD}); addToQueue('Akuntansi','INSERT',null,[id1,tgl,'Closing','Tutup Buku Pendapatan','Pendapatan Jasa','Ikhtisar L/R',currentPD]); 
    var id2=genId('TB'); db.akuntansi.push({id:id2,tgl:tgl,ket:'Tutup Buku Beban',debit:'Ikhtisar L/R',kredit:'Beban/Pembelian',nominal:currentBB}); addToQueue('Akuntansi','INSERT',null,[id2,tgl,'Closing','Tutup Buku Beban','Ikhtisar L/R','Beban/Pembelian',currentBB]); 
    var id3=genId('TB'); var d = laba>=0?'Ikhtisar L/R':'Tambahan Modal', k = laba>=0?'Tambahan Modal':'Ikhtisar L/R';
    db.akuntansi.push({id:id3,tgl:tgl,ket:'Tutup Laba/Rugi ke Modal',debit:d,kredit:k,nominal:Math.abs(laba)}); addToQueue('Akuntansi','INSERT',null,[id3,tgl,'Closing','Tutup Laba/Rugi ke Modal',d,k,Math.abs(laba)]);
    renderAll(); toast('Tutup Buku Selesai');
}

// PATCH MASTER DATA: Tambah Keterangan, Hapus
function simpanProduk(e) { e.preventDefault(); var idEdit = g('pIdValue').value, nm = g('pNama').value, kat = g('pKategori').value, hrg = parseInt(g('pHarga').value,10), ket = g('pKet').value; if (idEdit) { var i = db.produk.findIndex(p=>p.id===idEdit); if(i>-1) db.produk[i] = {id:idEdit,nama:nm,kategori:kat,harga:hrg,ket:ket}; addToQueue('Produk','UPDATE',idEdit,[idEdit,nm,kat,hrg,'',ket]); } else { var id=genId('P'); db.produk.push({id:id,nama:nm,kategori:kat,harga:hrg,ket:ket}); addToQueue('Produk','INSERT',null,[id,nm,kat,hrg,'',ket]); } batalEditProduk(); renderAll(); }
function editProduk(id) { var p=db.produk.find(x=>x.id===id); if(p){ g('pIdValue').value=p.id; g('pNama').value=p.nama; g('pKategori').value=p.kategori; g('pHarga').value=p.harga; g('pKet').value=p.ket; g('btnSimpanP').innerText='Update'; g('btnBatalP').style.display='block'; window.scrollTo(0,0); } }
function batalEditProduk() { g('formProduk').reset(); g('pIdValue').value=''; g('btnSimpanP').innerText='Simpan'; g('btnBatalP').style.display='none'; }
function hapusProduk(id) { if(confirm('Hapus?')) { db.produk=db.produk.filter(p=>p.id!==id); addToQueue('Produk','DELETE',id,null); renderAll(); } }
function renderTabelProduk() { 
    g('tabelProduk').innerHTML = db.produk.map(p => `<tr><td class="text-muted fw-bold">${esc(p.id)}</td><td class="fw-bold">${esc(p.nama)}</td><td>${esc(p.kategori)}</td><td class="fw-bold text-primary">${formatRp(p.harga)}</td><td><small>${esc(p.ket||'-')}</small></td><td class="text-center"><button class="btn btn-sm btn-outline-primary me-1" ${oc('editProduk',p.id)}><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-outline-danger" ${oc('hapusProduk',p.id)}><i class="fa-solid fa-trash"></i></button></td></tr>`).join(''); 
    
    // Perbarui datalist kategori
    var unikKat = [...new Set(db.produk.map(p=>p.kategori))];
    g('listKatProd').innerHTML = unikKat.map(k=>`<option value="${esc(k)}">`).join('');
}
function cetakKatalogBanner() {
    var d = g('pdfTarget');
    var html = `<div style="text-align:center; border-bottom:3px solid #000; padding-bottom:10px; margin-bottom:20px;"><h1 style="margin:0;font-size:24px;">${TOKO.nama}</h1><p style="margin:5px 0 0;">DAFTAR PRODUK & LAYANAN</p></div>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f1f1f1;"><th style="padding:10px;text-align:left;">Layanan</th><th style="padding:10px;text-align:right;">Harga (Rp)</th></tr></thead><tbody>`;
    db.produk.forEach(p => { html += `<tr><td style="padding:8px;border-bottom:1px dashed #ccc;"><b>${esc(p.nama)}</b><br><i style="font-size:10px;color:#666;">${esc(p.kategori)} ${p.ket?' | '+esc(p.ket):''}</i></td><td style="padding:8px;border-bottom:1px dashed #ccc;text-align:right;"><b>${formatRp(p.harga)}</b></td></tr>`; });
    html += `</tbody></table>`;
    d.innerHTML = html; d.style.display = 'block';
    html2pdf(d, { margin: 15, filename: 'Katalog.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).then(()=>d.style.display='none');
}

// --- SYNC & SAAS ---
function addToQueue(tb, act, id, arr, param) { var it = { opId: genId('OP'), table: tb, action: act, id: id, data: arr }; if(param) Object.assign(it, param); syncQueue.push(it); saveQ(); setSyncUI('pend'); }
async function processSync() {
  if (syncing) return; if (!syncQueue.length) { setSyncUI('ok'); return; }
  syncing = true; setSyncUI('sync'); var batch = syncQueue.slice(0, 50);
  try {
    let res = await apiPost('sync', batch);
    if (res && (res.status === 'success' || res.status === 'empty')) { syncQueue = syncQueue.slice(batch.length); saveQ(); setSyncUI(syncQueue.length?'pend':'ok'); }
    else { if(res && res.message && res.message.includes('Lisensi')) lockScreen(true); setSyncUI('fail'); }
  } catch(e) { setSyncUI('off'); } finally { syncing = false; }
}
setInterval(processSync, 8000);

async function bukaAdminPanel() {
  var pin = prompt('PIN Vendor SaaS:'); if(!pin) return;
  try { let r = await apiGet('verifyAdmin', `&pin=${encodeURIComponent(pin)}`); if(r.ok) showM('modalAdmin'); else alert(r.msg); } catch(e){ alert('Error koneksi'); }
}
async function updateSaaS() {
  var newDate=g('adminNewDate').value, currentPin=g('adminCurrentPin').value, newPin=g('adminNewPin').value;
  if(!currentPin || !newDate) return alert('Isi data Wajib');
  var d=new Date(newDate); d.setHours(23,59,59);
  try { let r=await apiPost('updateSaaS', {newDate:d.toISOString(), currentPin:currentPin, newPin:newPin}); alert(r.msg); if(r.success) location.reload(); }catch(e){alert('Gagal');}
}
async function updateVendorTheme() {
  try {
    var payload = { appName: g('admAppName').value, appIcon: g('admAppIcon').value, colorPrimary: g('admColorPrimary').value, colorLight: g('admColorLight').value, colorDark: g('admColorDark').value };
    let r = await apiPost('setVendor', payload); alert(r.msg); applyVendorTheme(payload);
  } catch(e) { alert('Gagal simpan tema'); }
}

function filterTabel(inp, tab) { var q=g(inp).value.toLowerCase(), r=g(tab).getElementsByTagName('tr'); for(var i=0;i<r.length;i++) r[i].style.display=r[i].textContent.toLowerCase().includes(q)?'':'none'; }
function toggleFullScreen() { var e=document.documentElement, d=document, r=e.requestFullscreen||e.webkitRequestFullscreen, x=d.exitFullscreen||d.webkitExitFullscreen; if(d.fullscreenElement||d.webkitFullscreenElement) {if(x)x.call(d);} else {if(r)r.call(e).catch(()=>toast('Layar penuh diblokir.'));} }
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => g('fsIcon').className = (document.fullscreenElement||document.webkitFullscreenElement)?'fa-solid fa-compress':'fa-solid fa-expand'));
function nav(id) { curTab=id; document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b=>{if(b.getAttribute('data-tab')===id)b.classList.add('active');else b.classList.remove('active');}); g(id).classList.add('active'); g('main').scrollTop=0; renderCart(); }

window.onload = initApp;