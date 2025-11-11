// === Ganti dengan ID dan nama sheet kamu ===
const sheetId = "1yWMH-wMkkzZaIqacEzDs_N22TLg6epYr-koTeoEq0NM";
const sheetIdArusKasOgoh = "15dApueJ9qEXtYl08Z7CrEe1JAwxbHsyGimAKcM9KC9g";
const sheetNameArusKasOgoh = "Form Responses 1";
const sheetNameInfoArusKasOgoh = "Info";
const urlArusKasOgoh = `https://opensheet.elk.sh/${sheetIdArusKasOgoh}/${sheetNameArusKasOgoh}`;
const urlInfoArusKasOgoh = `https://opensheet.elk.sh/${sheetIdArusKasOgoh}/${sheetNameInfoArusKasOgoh}`;
const sheetNameIuran2025 = "Iuran2025";
const sheetNameIuran2026 = "Iuran2026";
const sheetNameTotalKas = "Info";
const sheetNamePembayaranOgoh = "PembayaranOgohOgoh";
const urlIuran2025 = `https://opensheet.elk.sh/${sheetId}/${sheetNameIuran2025}`;
const urlIuran2026 = `https://opensheet.elk.sh/${sheetId}/${sheetNameIuran2026}`;
const urlTotalKas = `https://opensheet.elk.sh/${sheetId}/${sheetNameTotalKas}`;
const urlTotalPembayaranOgoh = `https://opensheet.elk.sh/${sheetId}/${sheetNameTotalKas}`;
const urlPembayaranOgoh = `https://opensheet.elk.sh/${sheetId}/${sheetNamePembayaranOgoh}`;

let semuaDataIuran2025 = [];
let semuaDataIuran2026 = [];
let semuaDataPembayaranOgoh = [];
let semuaDataArusKasOgoh = [];

// === Ambil data Iuran 2025 ===
fetch(urlIuran2025)
  .then((res) => res.json())
  .then((data) => {
    semuaDataIuran2025 = data;
    const tbody = document.querySelector("#dataTableIuran1 tbody");
    tbody.innerHTML = ""; // kosongkan dulu

    semuaDataIuran2025.forEach((row) => {
      const qrBox = document.createElement("div");
      qrBox.className = "qr-box";

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${row["Nama"] || ""}</td>
          <td>${ceklist(row["Januari"] || "")}</td>
          <td>${ceklist(row["Februari"] || "")}</td>
          <td>${ceklist(row["Maret"] || "")}</td>
          <td>${ceklist(row["April"] || "")}</td>
          <td>${ceklist(row["Mei"] || "")}</td>
          <td>${ceklist(row["Juni"] || "")}</td>
          <td>${ceklist(row["Juli"] || "")}</td>
          <td>${ceklist(row["Agustus"] || "")}</td>
          <td>${ceklist(row["September"] || "")}</td>
          <td>${ceklist(row["Oktober"] || "")}</td>
          <td>${ceklist(row["November"] || "")}</td>
          <td>${ceklist(row["Desember"] || "")}</td>
        `;
      tbody.appendChild(tr);
    });

    // === Inisialisasi DataTable setelah data masuk ===
    if ($.fn.dataTable.isDataTable("#dataTableIuran1")) {
      $("#dataTableIuran1").DataTable().clear().destroy();
    }
    $("#dataTableIuran1").DataTable({
      language: {
        search: "Alih adan dini:",
        lengthMenu: "Tampilkan _MENU_ data",
        info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
        paginate: {
          previous: "Sebelumnya",
          next: "Berikutnya",
        },
      },
    });
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// === Ambil data Iuran 2026 ===
fetch(urlIuran2026)
  .then((res) => res.json())
  .then((data) => {
    semuaDataIuran2026 = data;
    const tbody = document.querySelector("#dataTableIuran2 tbody");
    tbody.innerHTML = ""; // kosongkan dulu

    semuaDataIuran2026.forEach((row) => {
      const qrBox = document.createElement("div");
      qrBox.className = "qr-box";

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${row["Nama"] || ""}</td>
          <td>${ceklist(row["Januari"] || "")}</td>
          <td>${ceklist(row["Februari"] || "")}</td>
          <td>${ceklist(row["Maret"] || "")}</td>
          <td>${ceklist(row["April"] || "")}</td>
          <td>${ceklist(row["Mei"] || "")}</td>
          <td>${ceklist(row["Juni"] || "")}</td>
          <td>${ceklist(row["Juli"] || "")}</td>
          <td>${ceklist(row["Agustus"] || "")}</td>
          <td>${ceklist(row["September"] || "")}</td>
          <td>${ceklist(row["Oktober"] || "")}</td>
          <td>${ceklist(row["November"] || "")}</td>
          <td>${ceklist(row["Desember"] || "")}</td>
        `;
      tbody.appendChild(tr);
    });

    // === Inisialisasi DataTable setelah data masuk ===
    if ($.fn.dataTable.isDataTable("#dataTableIuran2")) {
      $("#dataTableIuran2").DataTable().clear().destroy();
    }
    $("#dataTableIuran2").DataTable({
      language: {
        search: "Alih adan dini:",
        lengthMenu: "Tampilkan _MENU_ data",
        info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
        paginate: {
          previous: "Sebelumnya",
          next: "Berikutnya",
        },
      },
    });
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// Ambil data Total Kas
fetch(urlTotalKas)
  .then((res) => res.json())
  .then((data) => {
    // misal kamu mau ambil nilai dari kolom 'Nilai' di baris pertama
    const totalKas = data[0]["Nilai"]; // ambil isi 1 cell

    // tampilkan di halaman
    document.getElementById("totalKas").innerText = formatRupiah(totalKas);
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// Format angka ke bentuk rupiah (opsional)
function formatRupiah(angka) {
  return angka.toLocaleString("id-ID");
}

// Ambil data Total Pembayran Ogoh
fetch(urlTotalPembayaranOgoh)
  .then((res) => res.json())
  .then((data) => {
    // misal kamu mau ambil nilai dari kolom 'Nilai' di baris pertama
    const totalPembayaranOgoh = data[1]["Nilai"]; // ambil isi 1 cell

    // tampilkan di halaman
    document.getElementById("totalPembayaranOgoh").innerText =
      formatRupiah(totalPembayaranOgoh);
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// Ambil data Total Pemasukan Kas Ogoh
fetch(urlInfoArusKasOgoh)
  .then((res) => res.json())
  .then((data) => {
    // misal kamu mau ambil nilai dari kolom 'Nilai' di baris pertama
    const totalPemasukan = data[0]["Kas Masuk"]; // ambil isi 1 cell
    const totalPengeluaran = data[0]["Kas Keluar"]; // ambil isi 1 cell
    const totalSaldo = data[0]["Saldo"]; // ambil isi 1 cell

    // tampilkan di halaman
    document.getElementById("totalPemasukanOgoh").innerText =
      formatRupiah(totalPemasukan);
    document.getElementById("totalPengeluaranOgoh").innerText =
      formatRupiah(totalPengeluaran);
    document.getElementById("totalSaldoOgoh").innerText =
      formatRupiah(totalSaldo);
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// === Ambil data Pembayaran Ogoh ===
fetch(urlPembayaranOgoh)
  .then((res) => res.json())
  .then((data) => {
    semuaDataPembayaranOgoh = data;
    const tbody = document.querySelector("#dataTablePembayaranOgoh tbody");
    tbody.innerHTML = ""; // kosongkan dulu

    semuaDataPembayaranOgoh.forEach((row) => {
      const qrBox = document.createElement("div");
      qrBox.className = "qr-box";
      // tentukan kelas warna berdasarkan status
      const statusText = row["Status"] || "";
      const statusClass =
        statusText === "Lunas" ? "text-success" : "text-danger";

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${row["Nama"] || ""}</td>
          <td>${row["Nominal"] || ""}</td>
          <td>${row["Dibayar"] || ""}</td>
          <td>${row["Kurang"] || ""}</td>
          <td class="${statusClass}">${statusText}</td>
        `;
      tbody.appendChild(tr);
    });

    // === Inisialisasi DataTable setelah data masuk ===
    if ($.fn.dataTable.isDataTable("#dataTablePembayaranOgoh")) {
      $("#dataTablePembayaranOgoh").DataTable().clear().destroy();
    }
    $("#dataTablePembayaranOgoh").DataTable({
      language: {
        search: "Alih adan dini:",
        lengthMenu: "Tampilkan _MENU_ data",
        info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
        paginate: {
          previous: "Sebelumnya",
          next: "Berikutnya",
        },
      },
    });
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// === Ambil data Arus Kas Ogoh ===
fetch(urlArusKasOgoh)
  .then((res) => res.json())
  .then((data) => {
    semuaDataArusKasOgoh = data;
    const tbody = document.querySelector("#dataTableArusKasOgoh tbody");
    tbody.innerHTML = ""; // kosongkan dulu

    semuaDataArusKasOgoh.forEach((row) => {
      const tr = document.createElement("tr");
      // Ambil link bukti (misal kolom "Bukti")
      const linkBukti = row["Bukti"] ? row["Bukti"].trim() : "";
      // Jika kolom Bukti berisi link, buat tombol
      const tombolBukti = linkBukti
        ? `<a href="${linkBukti}" target="_blank" class="btn btn-sm btn-primary">Lihat</a>`
        : "-";
      tr.innerHTML = `
          <td>${row["Tanggal"] || ""}</td>
          <td>${row["KATEGORI"] || ""}</td>
          <td>${row["Uraian"] || ""}</td>
          <td>Rp. ${formatRupiah(row["Nominal"]) || ""}</td>
          <td>${tombolBukti}</td>
        `;
      tbody.appendChild(tr);
    });

    // === Inisialisasi DataTable setelah data masuk ===
    if ($.fn.dataTable.isDataTable("#dataTableArusKasOgoh")) {
      $("#dataTableArusKasOgoh").DataTable().clear().destroy();
    }
    $("#dataTableArusKasOgoh").DataTable({
      language: {
        search: "Ape alih? :",
        lengthMenu: "Tampilkan _MENU_ data",
        info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
        paginate: {
          previous: "Sebelumnya",
          next: "Berikutnya",
        },
      },
    });
  })
  .catch((err) => console.error("Gagal ambil data:", err));

// === Fungsi untuk ubah TRUE/FALSE jadi icon checklist ===
function ceklist(value) {
  if (
    value === true ||
    value === "TRUE" ||
    value === "true" ||
    value === "Ya" ||
    value === "Sudah" ||
    value === "✓" ||
    value === "✔️"
  ) {
    return `<i class="fas fa-check text-success"></i>`;
  } else if (
    value === "FALSE" ||
    value === false ||
    value === "Belum" ||
    value === "Tidak"
  ) {
    return `<i class="fas fa-times text-danger"></i>`;
  } else {
    return "";
  }
}
