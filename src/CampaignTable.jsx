import { parseHourlyData } from './utils';

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
);

function calcCR(conv, clicks) {
  if (clicks > 0) return ((conv / clicks) * 100).toFixed(2);
  if (conv > 0) return '100.00';
  return '0.00';
}

export default function CampaignTable({ campaign, isToday, onCutChange }) {
  const { clicks, conversions } = parseHourlyData(campaign.hourlyData);

  const totalC = clicks.reduce((a, b) => a + b, 0);
  const totalConv = conversions.reduce((a, b) => a + b, 0);
  const totalNCR = calcCR(totalConv, totalC);
  const normalCRVals = clicks.map((c, i) => calcCR(conversions[i], c));

  function DataRow({ label, total, values, isCR }) {
    return (
      <tr>
        <td style={{ fontWeight: 600 }}>{label}</td>
        <td className={isCR ? 'cr-cell' : ''} style={{ fontWeight: 600, color: isCR ? '#667eea' : undefined }}>
          {isCR ? `${total}%` : total}
        </td>
        {values.map((v, i) => (
          <td key={i} className={isCR ? 'cr-cell' : ''} style={{ color: isCR ? '#667eea' : undefined }}>
            {isCR ? `${v}%` : v}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="campaign-block">
      <div className="metadata-section">
        <div className="metadata-item">
          <strong>DSP Name:</strong><span>{campaign.dspName}</span>
        </div>
        <div className="metadata-item">
          <strong>Campaign ID:</strong><span>{campaign.campaignId}</span>
        </div>
        <div className="metadata-item">
          <strong>Product:</strong><span>{campaign.productname}</span>
        </div>
        <div className="metadata-item">
          <strong>Links:</strong>
          {campaign.links !== '-' && campaign.links.startsWith('http')
            ? <a href={campaign.links} target="_blank" rel="noreferrer" className="clickable-link">{campaign.links}</a>
            : <span>{campaign.links}</span>}
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Total</th>
              {HOURS.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <DataRow label="Clicks" total={totalC} values={clicks} />
            <DataRow label="Conversion" total={totalConv} values={conversions} />
            <DataRow label="Normal CR" total={totalNCR} values={normalCRVals} isCR />
          </tbody>
        </table>
      </div>
    </div>
  );
}
