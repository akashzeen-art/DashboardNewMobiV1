export const API_URL = 'https://postback.v1mobi.com/postbacks/hourlyReport';
export const DSP_FILTERS = ['KS', 'TR', 'MN'];

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(dateString) {
  if (!dateString) return dateString;
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateString; }
}

export function getToday() {
  return formatDate(new Date());
}

export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

export function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: formatDate(start), end: formatDate(end) };
}

export function parseHourlyData(hourlyData) {
  const clicks = new Array(24).fill(0);
  const conversions = new Array(24).fill(0);
  const stp = new Array(24).fill(0);

  (hourlyData || []).forEach(item => {
    const hourStr = String(item.hour ?? '').trim();
    const match = hourStr.match(/^(\d{1,2}):\d{2}/);
    if (!match) return;
    const h = parseInt(match[1], 10);
    if (h < 0 || h >= 24) return;

    clicks[h] += parseInt(item.clicks ?? item.click ?? item.Clicks ?? 0, 10) || 0;
    conversions[h] += parseInt(item.conversions ?? item.conversion ?? item.Conversions ?? 0, 10) || 0;
    stp[h] += parseInt(item.stp ?? item.STP ?? 0, 10) || 0;
  });

  return { clicks, conversions, stp };
}

export function groupDataByDate(data) {
  const dateMap = new Map();
  const items = Array.isArray(data) ? data : (data ? [data] : []);

  items
    .filter(c => DSP_FILTERS.includes((c.dspName || '').trim()))
    .forEach(campaign => {
      const date = campaign.date || 'unknown';
      const key = `${campaign.dspName}_${campaign.campaignId}_${campaign.links}`;
      if (!dateMap.has(date)) dateMap.set(date, new Map());
      const dateGroup = dateMap.get(date);
      if (!dateGroup.has(key)) {
        dateGroup.set(key, {
          dspName: campaign.dspName || '-',
          campaignId: campaign.campaignId || '-',
          links: campaign.links || '-',
          productname: campaign.productname || '-',
          date,
          cut: campaign.cut ?? 0,
          hourlyData: [],
        });
      }
      if (Array.isArray(campaign.hourlyData)) {
        dateGroup.get(key).hourlyData.push(...campaign.hourlyData);
      }
    });

  return dateMap;
}

function escapeCSV(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCSVRows(campaign) {
  const { clicks, conversions } = parseHourlyData(campaign.hourlyData);
  const totalC = clicks.reduce((a, b) => a + b, 0);
  const totalConv = conversions.reduce((a, b) => a + b, 0);
  const totalNCR = totalC > 0 ? ((totalConv / totalC) * 100).toFixed(2) : '0.00';

  const d = escapeCSV(campaign.dspName);
  const id = escapeCSV(campaign.campaignId);
  const l = escapeCSV(campaign.links);

  const row = (label, total, vals) =>
    `${d},${id},${l},${label},${total},${vals.join(',')}\n`;

  return (
    row('Clicks', totalC, clicks) +
    row('Conversion', totalConv, conversions) +
    row('Normal CR', totalNCR + '%', clicks.map((c, i) => c > 0 ? ((conversions[i] / c) * 100).toFixed(2) + '%' : '0.00%'))
  );
}

function hourHeaders() {
  return Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
  ).join(',');
}

export function exportAllCSV(campaigns) {
  let csv = `DSP Name,Campaign ID,Links,Metric,Total,${hourHeaders()}\n`;
  campaigns.forEach(c => { csv += buildCSVRows(c); });
  downloadCSV(csv, `dashboard_${formatDate(new Date())}.csv`);
}

export function exportDateWiseCSV(rawData, selectedDates) {
  const dateMap = new Map();
  rawData.filter(c => DSP_FILTERS.includes((c.dspName || '').trim())).forEach(c => {
    const d = c.date || '';
    if (!dateMap.has(d)) dateMap.set(d, []);
    dateMap.get(d).push(c);
  });

  let count = 0;
  dateMap.forEach((campaigns, date) => {
    if (selectedDates && !selectedDates.includes(date)) return;
    const grouped = groupDataByDate(campaigns);
    let csv = `Date: ${date}\nDSP Name,Campaign ID,Links,Metric,Total,${hourHeaders()}\n`;
    grouped.forEach(dateGroup => {
      dateGroup.forEach(c => { csv += buildCSVRows(c); });
    });
    downloadCSV(csv, `dashboard_${date}.csv`);
    count++;
  });
  if (count > 1) alert(`Exported ${count} CSV files.`);
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
