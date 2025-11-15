import { useEffect, useState } from "react";

export function useAndamanData() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [ferries, setFerries] = useState([]);
  const [cabs, setCabs] = useState({});
  const [locAdventures, setLocAdventures] = useState([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const loc = await fetch("/data/locations.json").then((r) => r.json());
        const act = await fetch("/data/activities.json").then((r) => r.json());
        const fer = await fetch("/data/ferries.json").then((r) => r.json());
        const cab = await fetch("/data/cabs.json").then((r) => r.json());
        const la = await fetch("/data/location_adventures.json").then((r) =>
          r.json()
        );

        setLocations(loc);
        setActivities(act);
        setFerries(fer);
        setCabs(cab);
        setLocAdventures(la);

        setStatus("ready");
      } catch (e) {
        setError(e);
        setStatus("error");
      }
    }

    loadAll();
  }, []);

  return {
    status,
    error,
    locations,
    activities,
    ferries,
    cabs,
    locAdventures
  };
}
