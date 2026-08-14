import { useEffect, useMemo, useState } from 'react';

const STATIC_AGENT_IDS = [
  '320b2a48-4d9b-a075-30f1-1f93a9b638fa', // sova
  '569fdd95-4d10-43ab-ca70-79becc718b46', // sage
  'eb93336a-449b-9c1b-0a54-a891f7921d69', // phoenix
  '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', // brimstone
  'add6443a-41bd-e414-f6ad-e58d267f4e95', // jett
];

let cache = null; // Simple module-level cache

export default function useStaticAgents() {
  const [agents, setAgents] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return;
    const controller = new AbortController();
    const base = 'https://valorant-api.com/v1/agents';

    (async () => {
      try {
        setLoading(true);
        const reqs = STATIC_AGENT_IDS.map((id) =>
          fetch(`${base}/${id}?language=en-US`, { signal: controller.signal })
            .then((r) => r.json())
            .then((j) => j?.data)
        );
        const res = await Promise.allSettled(reqs);
        const ok = res
          .filter((r) => r.status === 'fulfilled' && r.value)
          .map((v) => ({
            uuid: v.value.uuid,
            displayName: v.value.displayName,
            fullPortrait: v.value.fullPortrait,
            role: v.value.role?.displayName || null,
            source: 'static',
          }));
        cache = ok;
        setAgents(ok);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return { staticAgents: agents, loading, error };
}
