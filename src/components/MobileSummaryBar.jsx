import React from "react";

export default function MobileSummaryBar({
  hotelsTotal,
  ferriesTotal,
  logisticsTotal,
  grandTotal,
  formatINR
}) {
  return (
    <div className="mobile-summary">
      <div>Total: {formatINR(grandTotal)}</div>
    </div>
  );
}
