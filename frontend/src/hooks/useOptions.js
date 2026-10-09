import { useEffect, useState } from 'react';
import api from '../api/client.js';

// Custom hook: loads a list from the API and maps it to <select> options.
// Example: const classes = useOptions('/classes', classLabel);
export default function useOptions(endpoint, toLabel, enabled = true) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true; // ignore the response if the component unmounted meanwhile
    api
      .get(endpoint, { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) setOptions(data.data.map((item) => ({ value: item._id, label: toLabel(item) })));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // toLabel is a stable module-level function, so it is safe to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled]);

  return options;
}
