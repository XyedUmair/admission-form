// ======E CONFIG ======
// یہاں اپنا Google Apps Script Web App URL لگائیں (نیچے steps میں بتاؤں گا کیسے حاصل کرنا ہے)
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyaPmlUCrQfs9Uv0iGNnK2w-pTg_Zf5y5OvKlCvXj_FoNpcO3TTklgKYfLC9_jjZjslIA/exec";









document.getElementById("admissionForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const formData = new FormData(this);

  fetch("https://script.google.com/macros/s/AKfycbyaPmlUCrQfs9Uv0iGNnK2w-pTg_Zf5y5OvKlCvXj_FoNpcO3TTklgKYfLC9_jjZjslIA/exec", {
    method: "POST",
    body: formData
  })
  .then(response => response.text())
  .then(data => {
    alert("✅ Data submitted successfully!");
    this.reset();
  })
  .catch(error => {
    alert("❌ Error submitting form!");
    console.error(error);
  });
});













const form = document.getElementById('admissionForm');
const statusEl = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = "Submitting...";
  const formData = new FormData(form);

  // convert to JSON
  const data = {};
  formData.forEach((v,k) => data[k] = v);

  // 1) Send to Google Apps Script (primary storage)
  try {
    const res = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const rj = await res.json();
    if (rj && rj.result === 'success') {
      statusEl.textContent = "Submitted successfully!";
      form.reset();
      saveLocalBackup(data); // save to localStorage backup as well
    } else {
      throw new Error(JSON.stringify(rj));
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Submission failed. Saved locally (download CSV).";
    saveLocalBackup(data);
  }
});

// Save entries in localStorage (simple client-side backup)
function saveLocalBackup(obj){
  const key = 'admission_backups_v1';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push({...obj, _timestamp: new Date().toISOString()});
  localStorage.setItem(key, JSON.stringify(arr));
}

// Download local backups as CSV
downloadBtn.addEventListener('click', () => {
  const key = 'admission_backups_v1';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  if (!arr.length) { alert('No local backups found'); return; }
  const csv = toCSV(arr);
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'admission_backups.csv';
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
});

function toCSV(objArray){
  const keys = Object.keys(objArray[0]);
  const lines = [keys.join(',')];
  for (const o of objArray){
    const row = keys.map(k => {
      let v = o[k] ?? '';
      v = String(v).replace(/"/g, '""'); // escape quotes
      if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v}"`;
      return v;
    }).join(',');
    lines.push(row);
  }
  return lines.join('\r\n');
}
