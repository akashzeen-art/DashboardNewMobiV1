import { useState } from 'react';
import { parseHourlyData, formatDateDisplay } from './utils';

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
);

export default function CampaignTable({ campaign, index, isToday, onCutChange }) {
  const { clicks, conversions, stp } = parseHourlyData(campaign.hourlyData);

  const totalC = clicks.reduce((a, b) => a + b, 0);
  const totalConv = conversions.reduce((a, b) => a + b, 0);
  const totalSTP = stp.reduce((a, b) => a + b, 0);
  const totalNCR = totalC > 0 ? ((totalConv / totalC) * 100).toFixed(2) : '0.00';
  const totalSCR = totalC > 0 ? ((totalSTP / totalC) * 100).toFixed(2) : '0.00';

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

  const normalCRVals = clicks.map((c, i) => c > 0 ? ((conversions[i] / c) * 100).toFixed(2) : '0.00');
  const stpCRVals = clicks.map((c, i) => c > 0 ? ((stp[i] / c) * 100).toFixed(2) : '0.00');

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
          <strong>Links:</strong>
          {campaign.links !== '-' && campaign.links.startsWith('http')
            ? <a href={campaign.links} target="_blank" rel="noreferrer" className="clickable-link">{campaign.links}</a>
            : <span>{campaign.links}</span>}
        </div>
        {isToday && (
          <div className="metadata-item">
            <strong>CUT:</strong>
            <select
              className="cut-dropdown"
              defaultValue={String(campaign.cut ?? 0)}
              onChange={e => onCutChange(campaign, e.target.value, e.target)}
            >
              {['0', '10', '20', '30'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}
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
            <DataRow label="STP" total={totalSTP} values={stp} />
            <DataRow label="Normal CR" total={totalNCR} values={normalCRVals} isCR />
            <DataRow label="STP CR" total={totalSCR} values={stpCRVals} isCR />
          </tbody>
        </table>
      </div>
    </div>
  );
}
