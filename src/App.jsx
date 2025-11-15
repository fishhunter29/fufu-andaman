import React, { useMemo, useState } from "react";
import { useAndamanData } from "./hooks/useAndamanData";
import MobileSummaryBar from "./components/MobileSummaryBar.jsx";

const safeNum = (n) => (typeof n === "number" && isFinite(n) ? n : 0);
const formatINR = (n) =>
  n?.toLocaleString?.("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }) ?? "₹0";

function buildCabLookups(cabsRaw) {
  const p2pMap = new Map();
  const p2pClassAgnostic = new Map();
  const dayMap = new Map();
  const dayClassAgnostic = new Map();

  if (!cabsRaw) return { p2pMap, p2pClassAgnostic, dayMap, dayClassAgnostic };

  const norm = (v) => String(v ?? "").trim();
  const num = (v) =>
    typeof v === "string" ? Number(v.replace(/[, ]/g, "")) : Number(v);

  const p2p = Array.isArray(cabsRaw.p2p) ? cabsRaw.p2p : [];
  for (const row of p2p) {
    const from = norm(row.fromId ?? row.from ?? row.src);
    const to = norm(row.toId ?? row.to ?? row.dest);
    const cls = norm(row.vehicleClass ?? "any").toLowerCase();
    const fare = num(row.fare ?? 0);
    if (!from || !to || !fare) continue;

    const key = `${from}|${to}|${cls}`;
    const keyNoCls = `${from}|${to}`;
    p2pMap.set(key, fare);

    if (!p2pClassAgnostic.has(keyNoCls)) p2pClassAgnostic.set(keyNoCls, fare);

    const rKey = `${to}|${from}|${cls}`;
    const rNoCls = `${to}|${from}`;
    if (!p2pMap.has(rKey)) p2pMap.set(rKey, fare);
    if (!p2pClassAgnostic.has(rNoCls)) p2pClassAgnostic.set(rNoCls, fare);
  }

  const day = Array.isArray(cabsRaw.day) ? cabsRaw.day : [];
  for (const row of day) {
    const island = norm(row.islandId ?? row.island_code ?? row.island);
    const hours = Number(row.hours ?? 8) || 8;
    const cls = norm(row.vehicleClass ?? "any").toLowerCase();
    const fare = num(row.fare ?? 0);
    if (!island || !fare) continue;

    dayMap.set(`${island}|${cls}|${hours}`, fare);
    if (!dayClassAgnostic.has(`${island}|${hours}`))
      dayClassAgnostic.set(`${island}|${hours}`, fare);
  }

  return { p2pMap, p2pClassAgnostic, dayMap, dayClassAgnostic };
}

function p2pBase({ hops, vehicleClass, lookups }) {
  const { p2pMap, p2pClassAgnostic } = lookups;
  const cls = (vehicleClass ?? "any").toLowerCase();
  let total = 0;

  for (const hop of hops || []) {
    const from = hop.fromId;
    const to = hop.toId;
    if (!from || !to) continue;

    let fare = p2pMap.get(`${from}|${to}|${cls}`);
    if (fare == null) fare = p2pMap.get(`${from}|${to}|any`);
    if (fare == null) fare = p2pClassAgnostic.get(`${from}|${to}`);

    total += safeNum(fare);
  }
  return total;
}

function dayCabTotal({ dayCabBlocks, vehicleClass, currentIslandId, lookups }) {
  const { dayMap, dayClassAgnostic } = lookups;
  const cls = (vehicleClass ?? "any").toLowerCase();
  let total = 0;

  for (const b of dayCabBlocks || []) {
    const island = b.islandId ?? currentIslandId;
    const hours = b.hours ?? 8;

    let fare = dayMap.get(`${island}|${cls}|${hours}`);
    if (fare == null) fare = dayMap.get(`${island}|any|${hours}`);
    if (fare == null) fare = dayClassAgnostic.get(`${island}|${hours}`);

    total += safeNum(fare);
  }
  return total;
}

export default function App() {
  const {
    status,
    error,
    locations: hookLocations,
    activities: hookActivities,
    ferries,
    cabs,
    locAdventures
  } = useAndamanData();

  const [selectedVehicleClass, setSelectedVehicleClass] = useState("sedan");
  const [selectedHops, setSelectedHops] = useState([]);
  const [dayCabBlocks, setDayCabBlocks] = useState([]);
  const [currentIslandId, setCurrentIslandId] = useState("PB");
  const [islandFilter, setIslandFilter] = useState("ALL");

  const cabLookups = useMemo(() => buildCabLookups(cabs), [cabs]);

  const hotelsTotal = 0;
  const ferriesTotal = 0;

  const logisticsTotal = useMemo(
    () =>
      p2pBase({
        hops: selectedHops,
        vehicleClass: selectedVehicleClass,
        lookups: cabLookups
      }) +
      dayCabTotal({
        dayCabBlocks,
        vehicleClass: selectedVehicleClass,
        currentIslandId,
        lookups: cabLookups
      }),
    [
      selectedHops,
      dayCabBlocks,
      selectedVehicleClass,
      currentIslandId,
      cabLookups
    ]
  );

  const grandTotal =
    safeNum(hotelsTotal) + safeNum(ferriesTotal) + safeNum(logisticsTotal);

  const uniqueIslands = useMemo(() => {
    const s = new Set(hookLocations.map((l) => l.island));
    return ["ALL", ...Array.from(s)];
  }, [hookLocations]);

  const locations = useMemo(() => {
    if (islandFilter === "ALL") return hookLocations;
    return hookLocations.filter(
      (l) => (l.island || "").toLowerCase() === islandFilter.toLowerCase()
    );
  }, [hookLocations, islandFilter]);

  if (status === "loading")
    return <div className="loading">Loading data…</div>;
  if (status === "error")
    return <div className="error">Failed: {String(error)}</div>;

  return (
    <div className="desk-root">
      <header className="desk-header">
        <div className="brand">Andaman Itinerary Builder</div>
        <div className="meta">
          <span>Locations: {hookLocations.length}</span>
          <span>Activities: {hookActivities.length}</span>
        </div>
      </header>

      <main className="desk-grid">
        <section className="panel">
          <h3>Filters</h3>

          <label className="control">
            <span>Island</span>
            <select
              value={islandFilter}
              onChange={(e) => setIslandFilter(e.target.value)}
            >
              {uniqueIslands.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="control">
            <span>Vehicle Class</span>
            <select
              value={selectedVehicleClass}
              onChange={(e) => setSelectedVehicleClass(e.target.value)}
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="any">Any</option>
            </select>
          </label>
        </section>

        <section className="panel">
          <h3>Locations ({locations.length})</h3>

          <ul className="list">
            {locations.slice(0, 20).map((l) => (
              <li key={l.id}>
                <div className="row">
                  <div>
                    <div className="title">{l.name}</div>
                    <div className="sub">{l.island}</div>
                  </div>

                  <button
                    className="btn"
                    onClick={() =>
                      setSelectedHops((h) => [
                        ...h,
                        { fromId: "PB001", toId: l.id }
                      ])
                    }
                  >
                    Add Hop
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h3>Trip Totals</h3>
          <div className="totals">
            <div className="trow">
              <span>Hotels</span>
              <b>{formatINR(hotelsTotal)}</b>
            </div>
            <div className="trow">
              <span>Ferries</span>
              <b>{formatINR(ferriesTotal)}</b>
            </div>
            <div className="trow">
              <span>Logistics</span>
              <b>{formatINR(logisticsTotal)}</b>
            </div>
            <div className="trow grand">
              <span>Total</span>
              <b>{formatINR(grandTotal)}</b>
            </div>
          </div>
        </section>
      </main>

      <MobileSummaryBar
        hotelsTotal={hotelsTotal}
        ferriesTotal={ferriesTotal}
        logisticsTotal={logisticsTotal}
        grandTotal={grandTotal}
        formatINR={formatINR}
      />
    </div>
  );
}
