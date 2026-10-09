// =============================================================
// KONFIGURASI API DAN PWA - V3
// =============================================================
const GAS_URL = "MASUKKAN_URL_WEB_APP_ANDA_DISINI";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Pembaruan aplikasi tersedia. Memuat ulang...');
          setTimeout(() => window.location.reload(), 1500);
        }
      };
    };
  });
}

async function apiGet(action, params = "") { let res = await fetch(`${GAS_URL}?action=${action}${params}`); return await res.json(); }
async function apiPost(action, payload) { let res = await fetch(`${GAS_URL}?action=${action}`, { method: 'POST', body: JSON.stringify(payload) }); return await res.json(); }

function applyVendorTheme(c) {
  if(!c || !c.appName) return;
  document.title = c.appName;
  document.querySelectorAll('.brand b').forEach(el => el.innerText = c.appName);
  if(c.appIcon) { document.getElementById('sideLogo').src = c.appIcon; document.getElementById('dynamic-favicon').href = c.appIcon; }
  const root = document.documentElement;
  root.style.setProperty('--c5', c.colorPrimary); root.style.setProperty('--c1', c.colorLight); root.style.setProperty('--c7', c.colorDark);
}

// Global Variabel
var CONFIG = { appName: 'ERP POS', alamat: 'Alamat', telp: '000', diskonBronze: 5, diskonGold: 10 };
var Q = "'", db = { produk: [], booking: [], member: [], akuntansi: [], transaksi: [] }, cart = [], syncing = false, syncQueue = [], curTab = 'pos', SC = null, toastT = null;
try { syncQueue = JSON.parse(localStorage.getItem('erpSyncQueue_v9')) || []; } catch(e){}

function g(id) { return document.getElementById(id); }
function formatRp(n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function genId(p) { return p + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
function oc(fn, id) { return 'onclick="' + fn + '(' + Q + esc(id) + Q + ')"'; }
function normWA(v) { var n = String(v||'').replace(/\D/g,''); if (n.charAt(0)==='0') n='62'+n.slice(1); else if (n.charAt(0)==='8') n='62'+n; return (n.length>=10)?n:''; }
function toast(msg) { var t = g('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(()=>t.style.display='none', 3000); }
function showM(id) { bootstrap.Modal.getOrCreateInstance(g(id)).show(); }
function hideM(id) { var m = bootstrap.Modal.getInstance(g(id)); if (m) m.hide(); }
function saveQ() { try { localStorage.setItem('erpSyncQueue_v9', JSON.stringify(syncQueue)); } catch(e){} }
function setSyncUI(k) { var m = { ok: ['text-success','Synced'], pend: ['text-warning','Pending'], sync: ['text-primary','Syncing'], fail: ['text-danger','Gagal'], off: ['text-danger','Offline'] }[k]; g('syncStatus').innerHTML = `<i class="fa-solid fa-circle ${m[0]} me-1" style="font-size:.55rem"></i>${m[1]}`; }

async function initApp() {
  setSyncUI(syncQueue.length ? 'pend' : 'ok'); gantiJenisJurnal();
  try {
    let s = await apiGet('getInitialData');
    if (s.vendorConfig) {
      CONFIG = s.vendorConfig; applyVendorTheme(CONFIG);
      g('admAppName').value = CONFIG.appName; g('admAlamat').value = CONFIG.alamat; g('admTelp').value = CONFIG.telp; g('admAppIcon').value = CONFIG.appIcon; g('admDiskonB').value = CONFIG.diskonBronze; g('admDiskonG').value = CONFIG.diskonGold; g('admColorPrimary').value = CONFIG.colorPrimary; g('admColorLight').value = CONFIG.colorLight; g('admColorDark').value = CONFIG.colorDark;
    }
    if (s.license && s.license.isExpired) g('saasLockScreen').style.display = 'flex';
    if (s.license && s.license.expiryDate) g('adminNewDate').value = String(s.license.expiryDate).split('T')[0];
    if(s.produk) db.produk = s.produk.map(r => ({ id: String(r[0]), nama: String(r[1]), kategori: String(r[2]), harga: Number(r[3])||0, ket: String(r[5]||'') }));
    if(s.booking) db.booking = s.booking.map(r => ({ id: String(r[0]), waktu: r[1], pelanggan: String(r[2]), layanan: String(r[3]), status: r[4] }));
    if(s.member) db.member = s.member.map(r => ({ id: String(r[0]), nama: String(r[1]), hp: String(r[2]), level: String(r[3]) }));
    if(s.transaksi) db.transaksi = s.transaksi.map(r => ({ id: String(r[0]), tgl: r[1], pelanggan: String(r[2]), total: Number(r[3])||0, metode: r[4], status: r[5], detail: String(r[6]), log: r[7] }));
    if(s.akuntansi) db.akuntansi = s.akuntansi.map(r => ({ id: String(r[0]), tgl: r[1], tipe: r[2], ket: String(r[3]), debit: String(r[4]), kredit: String(r[5]), nominal: Number(r[6])||0, ref: String(r[7]||'') }));
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
  var e = cart.find(c => c.id === id); if(e) e.qty++; else cart.push({id: p.id, nama: p.nama, kategori: p.kategori, harga: p.harga, qty: 1}); renderCart();
}
function kurangiItem(i) { if(cart[i].qty > 1) cart[i].qty--; else cart.splice(i,1); renderCart(); }
function toggleGuestInput() {
  var isGuest = g('posPelanggan').value === "";
  g('posGuestName').style.display = isGuest ? 'block' : 'none';
  renderCart(); // Recalculate discount based on selected member
}
function getDiskonLevel() {
  var mId = g('posPelanggan').value; if(!mId) return 0;
  var m = db.member.find(x => x.id === mId); if(!m) return 0;
  if(m.level.includes('Gold')) return parseInt(CONFIG.diskonGold, 10)||0;
  if(m.level.includes('Bronze')) return parseInt(CONFIG.diskonBronze, 10)||0;
  return 0;
}
function renderCart() {
  var subtotal = 0, count = 0, diskonPct = getDiskonLevel();
  var h = cart.map((c, i) => { subtotal += c.harga*c.qty; count += c.qty; return `<div class="tint p-2 mb-2 d-flex justify-content-between align-items-center"><div class="flex-grow-1 pe-2"><div class="fw-bold small">${esc(c.nama)}</div><div class="small fw-bold" style="color:var(--c5)">${formatRp(c.harga)}</div></div><div class="d-flex align-items-center bg-white border rounded-3"><button class="btn btn-sm" onclick="kurangiItem(${i})"><i class="fa-solid fa-minus"></i></button><span class="fw-bold px-1">${c.qty}</span><button class="btn btn-sm" ${oc('addToCart', c.id)}><i class="fa-solid fa-plus"></i></button></div></div>`; }).join('');
  g('cartItems').innerHTML = h || '<p class="text-center text-muted small mt-4">Keranjang Kosong</p>';
  var potongan = (subtotal * diskonPct) / 100;
  var total = subtotal - potongan;
  if (diskonPct > 0) { g('infoDiskon').style.display='block'; g('infoDiskon').innerText = `Diskon Member ${diskonPct}% : -${formatRp(potongan)}`; } else { g('infoDiskon').style.display='none'; }
  g('totalPrice').innerText = formatRp(total); g('cartCount').innerText = count + ' Item'; g('cartBarCount').innerText = count + ' Item'; g('cartBarTotal').innerText = formatRp(total);
  g('cartBar').style.display = (count > 0 && curTab === 'pos') ? 'flex' : 'none'; if(!count) toggleCart(false);
}
function toggleCart(open) { if(window.innerWidth>=992) return; var o = bootstrap.Offcanvas.getOrCreateInstance(g('cartPanel')); if(open) o.show(); else o.hide(); }

function prosesCheckout() {
  if(cart.length===0) { alert('Keranjang kosong!'); return; }
  var diskonPct = getDiskonLevel(), subtotal = cart.reduce((s,i) => s + i.harga*i.qty, 0), total = subtotal - ((subtotal * diskonPct) / 100);
  var co = g('posPelanggan'), isGuest = co.value === "";
  var custName = isGuest ? (g('posGuestName').value.trim() || 'Guest') : co.options[co.selectedIndex].text;
  var method = g('metodeBayar').value, status = g('statusBayar').value;
  var detail = cart.map(c => `${c.nama}(x${c.qty})`).join(', ');
  if(diskonPct > 0) detail += ` [Diskon ${diskonPct}%]`;
  
  var tgl = new Date().toISOString(), idTx = genId('TX');
  var newTx = { id: idTx, tgl: tgl, pelanggan: custName, total: total, metode: method, status: status, detail: detail, log: '-' };
  db.transaksi.unshift(newTx); addToQueue('Transaksi', 'INSERT', null, [idTx, tgl, custName, total, method, status, detail, '-']);
  
  var idJr = genId('JR'), akunDebit = status === 'Lunas' ? 'Kas ' + method : 'Piutang Usaha', ket = 'Penjualan ['+idTx+'] - '+custName;
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: ket, debit: akunDebit, kredit: 'Pendapatan Jasa', nominal: total, ref: idTx });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Otomatis POS', ket, akunDebit, 'Pendapatan Jasa', total, idTx]);
  
  var bkId = g('posRefBookingId').value; if(bkId) { var b = db.booking.find(x=>x.id===bkId); if(b) b.status='Selesai'; addToQueue('Booking', 'UPDATE_STATUS', bkId, null, { statusCol: 5, newStatus: 'Selesai' }); }
  cart = []; g('posPanggilBooking').value = ''; g('posRefBookingId').value = ''; g('posGuestName').value = ''; toggleCart(false); renderAll(); bukaStruk(newTx, 'STRUK PEMBAYARAN');
}

function bukaRiwayatPOS() { renderRiwayatPOS(); showM('modalRiwayat'); }
function renderRiwayatPOS() {
  g('tabelRiwayatPOS').innerHTML = db.transaksi.map(tx => {
    var bg = tx.status === 'Lunas' ? 'bg-success-subtle text-success' : (tx.status === 'Batal' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis');
    var act = tx.status==='Belum Bayar' ? `<button class="btn btn-sm btn-primary" ${oc('lunasiPiutang', tx.id)}>Lunasi</button>` : (tx.status==='Lunas' ? `<button class="btn btn-sm btn-outline-danger" ${oc('batalTransaksi', tx.id)}>Void</button>` : '');
    return `<tr><td><div class="fw-bold text-primary" style="cursor:pointer" onclick="cetakStrukUlang('${tx.id}')">${esc(tx.id)}</div><div class="text-muted" style="font-size:.75rem">${new Date(tx.tgl).toLocaleDateString('id-ID')}</div></td><td><div class="fw-bold">${esc(tx.pelanggan)}</div><div class="text-muted text-truncate" style="font-size:.75rem;max-width:12rem" title="${esc(tx.detail)}">${esc(tx.detail)}</div></td><td class="fw-bold">${formatRp(tx.total)}</td><td><span class="badge ${bg}">${esc(tx.status)}</span></td><td class="text-center">${act}</td></tr>`;
  }).join('');
}
function findTx(id) { return db.transaksi.find(t => t.id === id); }
function lunasiPiutang(idTx) {
  if(!confirm('Konfirmasi pelunasan?')) return; var tx = findTx(idTx); if(!tx) return;
  tx.status = 'Lunas'; tx.log = 'Dilunasi pd ' + new Date().toLocaleDateString('id-ID');
  var idJr = genId('JR'), tgl = new Date().toISOString();
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: 'Pelunasan ['+idTx+']', debit: 'Kas '+tx.metode, kredit: 'Piutang Usaha', nominal: tx.total, ref: idTx });
  addToQueue('Transaksi', 'UPDATE_STATUS', idTx, null, { statusCol: 6, newStatus: 'Lunas', auditCol: 8, auditText: tx.log });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Sistem', 'Pelunasan ['+idTx+']', 'Kas '+tx.metode, 'Piutang Usaha', tx.total, idTx]);
  renderAll();
}
function batalTransaksi(idTx) {
  var alasan = prompt('Alasan Void/Batal?'); if(!alasan) return; var tx = findTx(idTx); if(!tx) return;
  tx.status = 'Batal'; tx.log = 'VOID: ' + alasan;
  var idJr = genId('JR'), tgl = new Date().toISOString();
  db.akuntansi.push({ id: idJr, tgl: tgl, ket: 'VOID ['+idTx+']', debit: 'Pendapatan Jasa', kredit: 'Kas '+tx.metode, nominal: tx.total, ref: idTx });
  addToQueue('Transaksi', 'UPDATE_STATUS', idTx, null, { statusCol: 6, newStatus: 'Batal', auditCol: 8, auditText: tx.log });
  addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Reversal', 'VOID ['+idTx+']', 'Pendapatan Jasa', 'Kas '+tx.metode, tx.total, idTx]);
  renderAll();
}

// --- STRUK CANVAS (MEMANJANG) ---
function parseItems(d) { return String(d).split(', ').map(s => { var i = s.lastIndexOf('(x'); if(i>0 && s.endsWith(')')) { var q = parseInt(s.slice(i+2,-1),10); if(q>0) return {n:s.slice(0,i).trim(), q:q}; } return {n:s, q:1}; }); }
function cetakStrukUlang(id) { var t = findTx(id); if(t) { hideM('modalRiwayat'); setTimeout(()=>bukaStruk(t,'SALINAN STRUK'), 350); } }
function drawStruk(tx, hd) {
  var W=400, L=30, R=W-30, CX=W/2, y=0;
  var items = parseItems(tx.detail);
  var estHeight = 400 + (items.length * 30); 
  var cc = document.createElement('canvas'); cc.width = W; cc.height = estHeight;
  var c = cc.getContext('2d'); c.fillStyle='#fff'; c.fillRect(0,0,W,estHeight);
  
  function txt(t,x,font,col,al='left') { c.font=font; c.fillStyle=col; c.textAlign=al; c.fillText(t,x,y); }
  function row(a,b,col='#000',fb='normal 14px sans-serif') { y+=24; txt(a,L,fb,col); txt(b,R,fb,col,'right'); }
  
  y=50; c.fillStyle = CONFIG.colorPrimary; c.beginPath(); c.arc(CX,y-8,24,0,7); c.fill();
  c.fillStyle='#fff'; c.textAlign='center'; c.font='bold 24px serif'; c.fillText(CONFIG.appName.charAt(0).toUpperCase(), CX, y);
  y+=40; txt(CONFIG.appName, CX, 'bold 24px serif', '#000', 'center');
  y+=20; txt(CONFIG.alamat, CX, '12px sans-serif', '#444', 'center');
  y+=18; txt('Telp: '+CONFIG.telp, CX, '12px sans-serif', '#444', 'center');
  y+=30; txt(hd, CX, 'bold 16px sans-serif', '#000', 'center'); y+=10;
  
  row('No. TX', tx.id, '#444'); row('Tanggal', new Date(tx.tgl).toLocaleString('id-ID'), '#444'); row('Pelanggan', tx.pelanggan, '#444'); row('Metode', tx.metode, '#444');
  y+=20; c.beginPath(); c.moveTo(L,y); c.lineTo(R,y); c.strokeStyle='#ddd'; c.stroke(); y+=10;
  
  items.forEach(it => { row(it.n, 'x'+it.q, '#000', 'bold 15px sans-serif'); });
  
  y+=20; c.beginPath(); c.moveTo(L,y); c.lineTo(R,y); c.strokeStyle='#ddd'; c.stroke(); y+=10;
  row('TOTAL KESELURUHAN', formatRp(tx.total), '#000', 'bold 18px sans-serif');
  y+=40; txt(tx.status.toUpperCase(), CX, 'bold 18px sans-serif', tx.status==='Lunas'?'#047857':'#b91c1c', 'center');
  y+=40; txt('Terima Kasih Atas Kunjungan Anda!', CX, 'italic 13px sans-serif', '#444', 'center');
  
  // Crop to actual height
  var finalCv = document.createElement('canvas'); finalCv.width = W; finalCv.height = y+40;
  finalCv.getContext('2d').drawImage(cc, 0, 0);
  return Promise.resolve(finalCv);
}
function bukaStruk(tx, hd) {
  var ctx = { tx: tx, hd: hd, cv: null }; SC = ctx;
  var m = db.member.find(x => x.nama === tx.pelanggan); g('strukWA').value = m?normWA(m.hp):'';
  g('strukImg').removeAttribute('src'); showM('modalStruk');
  drawStruk(tx,hd).then(cv => { if(SC===ctx) { ctx.cv=cv; g('strukImg').src=cv.toDataURL('image/jpeg',0.9); } });
}
function strukBlob() { return new Promise(r => SC.cv.toBlob(r, 'image/jpeg', 0.9)); }
function strukSimpan() { if(!SC || !SC.cv) return; strukBlob().then(b => { var a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='Struk-'+SC.tx.id+'.jpg'; document.body.appendChild(a); a.click(); a.remove(); toast('Gambar Disimpan'); }); }
function strukWA() { var no = normWA(g('strukWA').value); if(!no) return toast('Isi nomor WA valid'); var text = `Halo, berikut struk kasir *${CONFIG.appName}* dengan ID ${SC.tx.id} sebesar ${formatRp(SC.tx.total)}. Terima kasih!`; strukBlob().then(b => { var file = new File([b], 'Struk.jpg', {type:'image/jpeg'}); if(navigator.canShare && navigator.canShare({files:[file]})) { navigator.share({files:[file], text:text}).catch(e=>{if(e.name!=='AbortError') fb();}); } else { strukSimpan(); setTimeout(()=>window.open('https://wa.me/'+no+'?text='+encodeURIComponent(text),'_blank'), 1000); } }); }

// --- THERMAL BLUETOOTH PRINTER ---
function cleanRp(num) { return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
async function btConnect() {
  if(!navigator.bluetooth) throw new Error('Bluetooth tidak didukung browser ini.');
  let dev = await navigator.bluetooth.requestDevice({ acceptAllDevices:true, optionalServices:['000018f0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb'] });
  let srv = await dev.gatt.connect(); let svs = await srv.getPrimaryServices();
  for(let s of svs) { let chs = await s.getCharacteristics(); for(let c of chs) { if(c.properties.write || c.properties.writeWithoutResponse) return c; } }
  throw new Error('Koneksi printer gagal.');
}
async function btSend(ch, data) { for(let i=0; i<data.length; i+=100) { let p=Uint8Array.from(data.slice(i,i+100)); if(ch.properties.writeWithoutResponse) await ch.writeValueWithoutResponse(p); else await ch.writeValue(p); await new Promise(r=>setTimeout(r,40)); } }
function escPos(tx, hd) {
  var W=32, o=[]; function raw(...a){o.push(...a);} function line(s){ for(let i=0;i<s.length;i++) o.push(s.charCodeAt(i)); o.push(10); } function sep(){line('-'.repeat(W));} function row(l,r){ l=String(l);r=String(r); l=l.slice(0,Math.max(1,W-r.length-1)); line(l+' '.repeat(W-l.length-r.length)+r); }
  raw(27,64, 27,97,1, 29,33,17); line(CONFIG.appName); raw(29,33,0); line(hd); raw(27,97,0); sep();
  row('No', tx.id); row('Tgl', new Date(tx.tgl).toLocaleString('id-ID').substring(0,16)); row('Plg', tx.pelanggan); sep();
  parseItems(tx.detail).forEach(i=>row(i.n, 'x'+i.q)); sep();
  raw(27,69,1); row('TOTAL', 'Rp ' + cleanRp(tx.total)); raw(27,69,0); row('Status', tx.status); sep();
  raw(27,97,1); line('Terima kasih!'); raw(27,100,4, 29,86,66,0); return o;
}
function strukCetakBT() {
  if(!SC) return;
  btConnect().then(ch => btSend(ch, escPos(SC.tx, SC.hd))).then(() => toast('Berhasil Mencetak'))
  .catch(e => { if(e.name!=='NotFoundError') alert('Error BT: ' + e.message); });
}

// --- MASTER DATA & CRM ---
function tambahMember(e) { e.preventDefault(); var idEdit = g('mIdValue').value, nm = g('mNama').value, hp = g('mHP').value, lvl = g('mLevel').value; if(idEdit) { var i = db.member.findIndex(m=>m.id===idEdit); if(i>-1) db.member[i]={id:idEdit,nama:nm,hp:hp,level:lvl}; addToQueue('Member','UPDATE',idEdit,[idEdit,nm,hp,lvl,'0','Aktif']); } else { var id=genId('MB'); db.member.push({id:id,nama:nm,hp:hp,level:lvl}); addToQueue('Member','INSERT',null,[id,nm,hp,lvl,'0','Aktif']); } batalEditMember(); renderAll(); }
function batalEditMember() { g('mIdValue').value=''; g('mNama').value=''; g('mHP').value=''; g('btnSimpanM').innerText='Simpan'; g('btnBatalM').style.display='none'; }
function editMember(id) { var m=db.member.find(x=>x.id===id); if(m){ g('mIdValue').value=m.id; g('mNama').value=m.nama; g('mHP').value=m.hp; g('mLevel').value=m.level; g('btnSimpanM').innerText='Update'; g('btnBatalM').style.display='block'; window.scrollTo(0,0); } }
function cetakIDCard(id) {
    var m = db.member.find(x=>x.id===id); if(!m) return;
    var d = document.getElementById('printTarget');
    d.innerHTML = `<div style="width:340px;height:210px;background:linear-gradient(135deg, ${CONFIG.colorPrimary}, ${CONFIG.colorDark});border-radius:15px;color:white;padding:20px;position:relative;box-shadow:0 10px 20px rgba(0,0,0,0.2);font-family:sans-serif;">
        <h2 style="margin:0;font-size:20px;text-transform:uppercase;">${CONFIG.appName}</h2>
        <div style="font-size:10px;opacity:0.8;margin-bottom:20px;">MEMBER CARD</div>
        <div style="font-size:18px;letter-spacing:2px;margin-bottom:10px;">${m.id}</div>
        <div style="font-size:22px;font-weight:bold;text-transform:uppercase;margin-bottom:5px;">${m.nama}</div>
        <div style="font-size:12px;opacity:0.9;">LEVEL: ${m.level.toUpperCase()}</div>
        <div style="position:absolute;bottom:20px;right:20px;font-size:10px;opacity:0.7;">TERDAFTAR: ${new Date().getFullYear()}</div>
    </div>`;
    d.style.display = 'block';
    html2pdf(d, { margin: 5, filename: 'ID_Card_'+m.nama+'.pdf', image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: [90, 60], orientation: 'landscape' } }).then(()=>d.style.display='none');
}
function renderMember() {
  g('listMember').innerHTML = db.member.map(m => `<div class="col-sm-6 col-xl-4"><div class="tint p-3 d-flex align-items-center gap-3"><div class="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width:48px;height:48px;background:var(--c2);color:var(--c6)">${esc(m.nama.charAt(0))}</div><div class="flex-grow-1"><div class="fw-bold">${esc(m.nama)}</div><div class="small text-muted mb-1">${esc(m.hp||'-')} &bull; <b>${esc(m.level)}</b></div><div class="d-flex gap-1"><button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size:10px;" ${oc('editMember',m.id)}><i class="fa-solid fa-pen"></i> Edit</button><button class="btn btn-sm btn-outline-dark py-0 px-2" style="font-size:10px;" ${oc('cetakIDCard',m.id)}><i class="fa-solid fa-id-card"></i> Card</button></div></div></div></div>`).join('');
  var opt = '<option value="">-- Guest (Ketik Manual) --</option>' + db.member.map(m => `<option value="${esc(m.id)}">${esc(m.nama)}</option>`).join(''); g('posPelanggan').innerHTML = opt;
}
function simpanProduk(e) { e.preventDefault(); var idEdit = g('pIdValue').value, nm = g('pNama').value, kat = g('pKategori').value, hrg = parseInt(g('pHarga').value,10), ket = g('pKet').value; if(idEdit) { var i=db.produk.findIndex(p=>p.id===idEdit); if(i>-1) db.produk[i]={id:idEdit,nama:nm,kategori:kat,harga:hrg,ket:ket}; addToQueue('Produk','UPDATE',idEdit,[idEdit,nm,kat,hrg,'',ket]); } else { var id=genId('P'); db.produk.push({id:id,nama:nm,kategori:kat,harga:hrg,ket:ket}); addToQueue('Produk','INSERT',null,[id,nm,kat,hrg,'',ket]); } batalEditProduk(); renderAll(); }
function editProduk(id) { var p=db.produk.find(x=>x.id===id); if(p){ g('pIdValue').value=p.id; g('pNama').value=p.nama; g('pKategori').value=p.kategori; g('pHarga').value=p.harga; g('pKet').value=p.ket; g('btnSimpanP').innerText='Update'; g('btnBatalP').style.display='block'; window.scrollTo(0,0); } }
function batalEditProduk() { g('formProduk').reset(); g('pIdValue').value=''; g('btnSimpanP').innerText='Simpan'; g('btnBatalP').style.display='none'; }
function hapusProduk(id) { if(confirm('Hapus Data Permanen?')) { db.produk=db.produk.filter(p=>p.id!==id); addToQueue('Produk','DELETE',id,null); renderAll(); } }
function renderTabelProduk() { g('tabelProduk').innerHTML = db.produk.map(p => `<tr><td class="text-muted fw-bold">${esc(p.id)}</td><td class="fw-bold">${esc(p.nama)}</td><td>${esc(p.kategori)}</td><td class="fw-bold text-success">${formatRp(p.harga)}</td><td class="text-truncate" style="max-width:150px;" title="${esc(p.ket)}">${esc(p.ket||'-')}</td><td class="text-center"><button class="btn btn-sm btn-outline-primary me-1" ${oc('editProduk',p.id)}><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-outline-danger" ${oc('hapusProduk',p.id)}><i class="fa-solid fa-trash"></i></button></td></tr>`).join(''); }

// --- ANTREAM BOOKING ---
function showModalBooking() {
    var pOpt = db.produk.map(p=>`<option value="${esc(p.nama)}">${esc(p.nama)} - ${formatRp(p.harga)}</option>`).join('');
    var html = `<form onsubmit="tambahBooking(event)" class="d-grid gap-3"><input type="datetime-local" id="bWaktu" required class="form-control"><input type="text" id="bPelanggan" placeholder="Nama Pelanggan" required class="form-control"><select id="bLayanan" required class="form-select"><option value="">-- Pilih Layanan Utama --</option>${pOpt}</select><button type="submit" class="btn btn-primary w-100">Simpan Antrean</button></form>`;
    g('printTarget').innerHTML = `<div style="position:fixed;top:20%;left:50%;transform:translate(-50%,0);background:#fff;padding:20px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:9999;width:90%;max-width:400px;"><div class="d-flex justify-content-between mb-3"><h5 class="fw-bold m-0">Tambah Antrean</h5><button type="button" class="btn-close" onclick="g('printTarget').style.display='none'"></button></div>${html}</div>`;
    g('printTarget').style.display='block';
}
function tambahBooking(e) { e.preventDefault(); var b = { id: genId('BK'), waktu: g('bWaktu').value, pelanggan: g('bPelanggan').value, layanan: g('bLayanan').value, status: 'Menunggu' }; db.booking.push(b); addToQueue('Booking', 'INSERT', null, [b.id, b.waktu, b.pelanggan, b.layanan, b.status]); g('printTarget').style.display='none'; renderAll(); toast('Antrean Ditambahkan'); }
function hapusBooking(id) { if(confirm('Batalkan Antrean?')){ db.booking=db.booking.filter(b=>b.id!==id); addToQueue('Booking','DELETE',id,null); renderAll(); } }
function renderBooking() {
    var act = db.booking.filter(b => b.status === 'Menunggu');
    g('posPanggilBooking').innerHTML = '<option value="">Panggil Antrean...</option>' + act.map(b => `<option value="${esc(b.id)}">${esc(b.pelanggan)} - ${new Date(b.waktu).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</option>`).join('');
    g('listBooking').innerHTML = act.map(b => `<div class="col-md-6 col-lg-4"><div class="cardx p-3 border-start border-4 border-primary position-relative"><button class="btn btn-sm text-danger position-absolute top-0 end-0 m-2" ${oc('hapusBooking',b.id)}><i class="fa-solid fa-trash"></i></button><div class="fw-bold fs-5">${esc(b.pelanggan)}</div><div class="small fw-bold text-primary mb-1"><i class="fa-solid fa-clock"></i> ${new Date(b.waktu).toLocaleString('id-ID')}</div><div class="small text-muted px-2 py-1 bg-light rounded">${esc(b.layanan)}</div></div></div>`).join('');
}
function loadBookingKeCart(idBk) {
  if(!idBk) { g('posRefBookingId').value = ''; return; }
  var bk = db.booking.find(b => b.id === idBk); if(!bk) return;
  var isMember = db.member.find(m => m.nama.toLowerCase() === bk.pelanggan.toLowerCase());
  if(isMember) { g('posPelanggan').value = isMember.id; toggleGuestInput(); } else { g('posPelanggan').value = ""; toggleGuestInput(); g('posGuestName').value = bk.pelanggan; }
  g('posRefBookingId').value = bk.id; var p = db.produk.find(x => x.nama.toLowerCase() === String(bk.layanan).trim().toLowerCase()); if(p && !cart.some(c=>c.id===p.id)) addToCart(p.id); else toast('Layanan ditarik ke POS');
}

// --- AKUNTING & TUTUP BUKU ---
function gantiJenisJurnal() { var j = g('jJenisKas').value, o = g('jAkunLawan'); if (j === 'Pengeluaran') o.placeholder = 'Misal: Beban Listrik, Gaji'; else if (j === 'Pemasukan') o.placeholder = 'Misal: Bunga Bank, Komisi'; else o.placeholder = 'Misal: Tambahan Modal, Prive'; }
function simpanJurnalManual(e) { e.preventDefault(); var tgl = g('jTgl').value, jenis = g('jJenisKas').value, akun = g('jAkunLawan').value, ket = g('jKet').value, nom = parseInt(g('jNominal').value,10); if(nom<=0)return; var idJr = genId('JM'), deb = jenis==='Pengeluaran'?akun:'Kas Utama', kre = jenis==='Pengeluaran'?'Kas Utama':akun; db.akuntansi.push({ id: idJr, tgl: tgl, ket: ket, debit: deb, kredit: kre, nominal: nom, ref: 'MANUAL' }); addToQueue('Akuntansi', 'INSERT', null, [idJr, tgl, 'Manual', ket, deb, kre, nom, 'MANUAL']); e.target.reset(); gantiJenisJurnal(); renderAll(); toast('Jurnal Dicatat'); }
function hapusJurnal(id) { if(confirm('Hapus Jurnal ini? Jika ini transaksi POS, nota tidak akan terhapus.')){ db.akuntansi=db.akuntansi.filter(a=>a.id!==id); addToQueue('Akuntansi','DELETE',id,null); renderAll(); toast('Terhapus'); } }

var totalTBPendapatan = 0, totalTBBeban = 0;
function renderLaporanAkuntansi() {
  var pd=0, bb=0, md=0;
  g('tabelJurnal').innerHTML = db.akuntansi.slice().reverse().map(a => {
    var isTutup = a.ref.includes('TB_');
    if(a.kredit.includes('Pendapatan')) pd+=a.nominal; if(a.debit.includes('Pendapatan')) pd-=a.nominal;
    if(a.debit.includes('Beban')||a.debit.includes('Biaya')||a.debit.includes('Pembelian')) bb+=a.nominal; if(a.kredit.includes('Beban')) bb-=a.nominal;
    if(a.kredit.includes('Modal')||a.kredit.includes('Ditahan')) md+=a.nominal; if(a.debit.includes('Prive')||a.debit.includes('Modal')) md-=a.nominal;
    var txClick = a.ref.startsWith('TX') ? `style="cursor:pointer;color:blue;" onclick="cetakStrukUlang('${a.ref}')"` : '';
    return `<tr class="${isTutup?'bg-danger-subtle':''}"><td class="text-nowrap">${new Date(a.tgl).toLocaleDateString('id-ID')}</td><td><span ${txClick}>${esc(a.ket)}</span></td><td>${esc(a.debit)}</td><td>${esc(a.kredit)}</td><td class="text-end fw-bold">${formatRp(a.nominal)}</td><td class="text-center"><button class="btn btn-sm btn-outline-danger py-0 px-2" ${oc('hapusJurnal',a.id)}><i class="fa-solid fa-trash"></i></button></td></tr>`;
  }).join('');
  totalTBPendapatan = pd; totalTBBeban = bb;
  g('dashPendapatan').innerText=formatRp(pd); g('dashBeban').innerText=formatRp(bb); g('dashModal').innerText=formatRp(md); g('dashLaba').innerText=formatRp(pd-bb);
}

function showModalTutupBuku() {
    g('tbPendapatan').innerText = formatRp(totalTBPendapatan); g('tbBeban').innerText = formatRp(totalTBBeban); g('tbLaba').innerText = formatRp(totalTBPendapatan - totalTBBeban);
    showM('modalTutupBuku');
}
function prosesTutupBuku() {
    if(totalTBPendapatan === 0 && totalTBBeban === 0) return alert('Tidak ada transaksi untuk ditutup.');
    var laba = totalTBPendapatan - totalTBBeban;
    var tbRef = genId('TB_'); var tgl = new Date().toISOString();
    // 1. Nol-kan Pendapatan
    if(totalTBPendapatan > 0) { var id1=genId('JR'); db.akuntansi.push({id:id1,tgl:tgl,ket:'Tutup Buku Pendapatan',debit:'Pendapatan Jasa',kredit:'Ikhtisar Laba/Rugi',nominal:totalTBPendapatan,ref:tbRef}); addToQueue('Akuntansi','INSERT',null,[id1,tgl,'Closing','Tutup Buku Pendapatan','Pendapatan Jasa','Ikhtisar Laba/Rugi',totalTBPendapatan,tbRef]); }
    // 2. Nol-kan Beban
    if(totalTBBeban > 0) { var id2=genId('JR'); db.akuntansi.push({id:id2,tgl:tgl,ket:'Tutup Buku Beban',debit:'Ikhtisar Laba/Rugi',kredit:'Beban Operasional',nominal:totalTBBeban,ref:tbRef}); addToQueue('Akuntansi','INSERT',null,[id2,tgl,'Closing','Tutup Buku Beban','Ikhtisar Laba/Rugi','Beban Operasional',totalTBBeban,tbRef]); }
    // 3. Pindah Laba/Rugi ke Modal
    var id3=genId('JR'); var d = laba>=0?'Ikhtisar Laba/Rugi':'Modal Ditahan', k = laba>=0?'Modal Ditahan':'Ikhtisar Laba/Rugi';
    db.akuntansi.push({id:id3,tgl:tgl,ket:'Pemindahan Laba ke Modal',debit:d,kredit:k,nominal:Math.abs(laba),ref:tbRef}); addToQueue('Akuntansi','INSERT',null,[id3,tgl,'Closing','Pemindahan Laba ke Modal',d,k,Math.abs(laba),tbRef]);
    hideM('modalTutupBuku'); renderAll(); toast('Tutup Buku Berhasil');
}

// --- CETAK PDF EXPORT (Mobile Friendly) ---
function getKopSuratHTML(title) {
    return `<div style="text-align:center; border-bottom:3px solid #000; padding-bottom:15px; margin-bottom:20px;">
        <h1 style="margin:0;font-size:24px;color:${CONFIG.colorPrimary}">${CONFIG.appName}</h1>
        <p style="margin:5px 0 0;font-size:12px;">${CONFIG.alamat} | Telp: ${CONFIG.telp}</p>
        <h3 style="margin:15px 0 0;font-size:18px;">${title}</h3>
        <p style="margin:0;font-size:10px;color:#666;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
    </div>`;
}
function cetakLaporanLabaRugi() {
    var d = document.getElementById('printTarget');
    var html = getKopSuratHTML('LAPORAN LABA RUGI BERJALAN');
    html += `<table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:12px;">
        <tr><td style="padding:8px;border-bottom:1px solid #ccc;"><b>PENDAPATAN USAHA</b></td><td style="padding:8px;border-bottom:1px solid #ccc;text-align:right;"><b>${formatRp(totalTBPendapatan)}</b></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ccc;"><b>BEBAN/BIAYA USAHA</b></td><td style="padding:8px;border-bottom:1px solid #ccc;text-align:right;color:red;"><b>(${formatRp(totalTBBeban)})</b></td></tr>
        <tr style="background:#f1f1f1;"><td style="padding:12px 8px;border-top:2px solid #000;"><b>LABA/RUGI BERSIH</b></td><td style="padding:12px 8px;border-top:2px solid #000;text-align:right;font-size:14px;"><b>${formatRp(totalTBPendapatan - totalTBBeban)}</b></td></tr>
    </table>`;
    d.innerHTML = html; d.style.display = 'block';
    html2pdf(d, { margin: 15, filename: 'Laporan_Laba_Rugi.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).then(()=>d.style.display='none');
}
function cetakKatalogPDF() {
    var d = document.getElementById('printTarget');
    var html = getKopSuratHTML('KATALOG PRODUK & LAYANAN');
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:${CONFIG.colorPrimary};color:white;">
        <th style="padding:10px;text-align:left;">Nama Produk/Layanan</th><th style="padding:10px;text-align:left;">Kategori</th><th style="padding:10px;text-align:right;">Harga (Rp)</th></tr></thead><tbody>`;
    db.produk.forEach(p => { html += `<tr><td style="padding:8px;border-bottom:1px dashed #ccc;"><b>${esc(p.nama)}</b><br><i style="font-size:10px;color:#666;">${esc(p.ket)}</i></td><td style="padding:8px;border-bottom:1px dashed #ccc;">${esc(p.kategori)}</td><td style="padding:8px;border-bottom:1px dashed #ccc;text-align:right;"><b>${formatRp(p.harga)}</b></td></tr>`; });
    html += `</tbody></table>`;
    d.innerHTML = html; d.style.display = 'block';
    html2pdf(d, { margin: 15, filename: 'Katalog_Promosi.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).then(()=>d.style.display='none');
}

// --- VENDOR & SYSTEM ---
setInterval(processSync, 8000);
async function processSync() {
  if (syncing) return; if (!syncQueue.length) { setSyncUI('ok'); return; }
  syncing = true; setSyncUI('sync'); var batch = syncQueue.slice(0, 50);
  try {
    let res = await apiPost('sync', batch);
    if (res && (res.status === 'success' || res.status === 'empty')) { syncQueue = syncQueue.slice(batch.length); saveQ(); setSyncUI(syncQueue.length?'pend':'ok'); }
    else { if(res && res.message && res.message.includes('Lisensi')) g('saasLockScreen').style.display = 'flex'; setSyncUI('fail'); }
  } catch(e) { setSyncUI('off'); } finally { syncing = false; }
}

async function bukaAdminPanel() { var pin = prompt('Masukkan PIN Vendor SaaS (Default: 123456):'); if(!pin) return; try { let r = await apiGet('verifyAdmin', `&pin=${encodeURIComponent(pin)}`); if(r.ok) showM('modalAdmin'); else alert(r.msg); } catch(e){ alert('Error koneksi backend.'); } }
async function updateSaaS() {
  var newDate=g('adminNewDate').value, currentPin=g('adminCurrentPin').value, newPin=g('adminNewPin').value;
  if(!currentPin || !newDate) return alert('Isi data wajib (PIN saat ini dan Tanggal).');
  try { let r=await apiPost('updateSaaS', {newDate:newDate, currentPin:currentPin, newPin:newPin}); alert(r.msg); if(r.success) location.reload(); }catch(e){alert('Gagal.');}
}
async function updateVendorTheme() {
  try {
    var payload = { appName: g('admAppName').value, alamat: g('admAlamat').value, telp: g('admTelp').value, appIcon: g('admAppIcon').value, diskonBronze: parseInt(g('admDiskonB').value)||0, diskonGold: parseInt(g('admDiskonG').value)||0, colorPrimary: g('admColorPrimary').value, colorLight: g('admColorLight').value, colorDark: g('admColorDark').value };
    let r = await apiPost('setVendor', payload); alert(r.msg);
    if(r.success){ CONFIG = payload; applyVendorTheme(CONFIG); renderCart(); hideM('modalAdmin'); }
  } catch(e) { alert('Gagal menyimpan.'); }
}

function filterTabel(inp, tab) { var q=g(inp).value.toLowerCase(), r=g(tab).getElementsByTagName('tr'); for(var i=0;i<r.length;i++) r[i].style.display=r[i].textContent.toLowerCase().includes(q)?'':'none'; }
function toggleFullScreen() { var e=document.documentElement, d=document, r=e.requestFullscreen||e.webkitRequestFullscreen, x=d.exitFullscreen||d.webkitExitFullscreen; if(d.fullscreenElement||d.webkitFullscreenElement) {if(x)x.call(d);} else {if(r)r.call(e).catch(()=>toast('Diblokir browser.'));} }
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => g('fsIcon').className = (document.fullscreenElement||document.webkitFullscreenElement)?'fa-solid fa-compress':'fa-solid fa-expand'));
function nav(id) { curTab=id; document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b=>{if(b.getAttribute('data-tab')===id)b.classList.add('active');else b.classList.remove('active');}); g(id).classList.add('active'); g('main').scrollTop=0; renderCart(); }

window.onload = initApp;