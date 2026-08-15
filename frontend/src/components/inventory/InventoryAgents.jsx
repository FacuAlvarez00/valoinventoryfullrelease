import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { Pagination } from '../ui/kit';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

const STATIC_AGENT_IDS = [
  // sova
  '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  // sage
  '569fdd95-4d10-43ab-ca70-79becc718b46',
  // phoenix
  'eb93336a-449b-9c1b-0a54-a891f7921d69',
  // brimstone
  '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  // jett
  'add6443a-41bd-e414-f6ad-e58d267f4e95',
];

async function fetchStaticAgents(signal) {
  const base = 'https://valorant-api.com/v1/agents';
  const reqs = STATIC_AGENT_IDS.map((id) =>
    fetch(`${base}/${id}?language=en-US`, { signal })
      .then((r) => r.json())
      .then((json) => json?.data)
  );

  const results = await Promise.allSettled(reqs);

  // English role mapping for the five default agents
  const roleMapping = {
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Initiator', // Sova
    '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sentinel',  // Sage
    'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Duelist',  // Phoenix
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': 'Controller', // Brimstone
    'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Duelist',  // Jett
  };

  // Normalize the API response for the component
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map(({ value }) => ({
      uuid: value.uuid,
      displayName: value.displayName,
      fullPortrait: value.fullPortrait,
      role: roleMapping[value.uuid] || value.role?.displayName || null,
      processed: true,
      index: -1,
      source: 'static',
    }));
}

export default function InventoryAgents() {
  const { riotAccount, loading, error } = useInventory();
  const [agentsDetails, setAgentsDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Load the static agents and any agents returned by the backend
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setDetailsLoading(true);
      try {
        // Load the five default agents
        const staticAgents = await fetchStaticAgents(signal);

        // Normalize agents returned by the backend
        const backendAgents = Array.isArray(riotAccount?.agents)
          ? riotAccount.agents.map((agent, idx) => ({
              ...agent,
              processed: true,
              index: idx,
              source: 'backend',
              // The backend may return a role as an object or a string
              role:
                typeof agent.role === 'string'
                  ? agent.role
                  : agent.role?.displayName || agent.role || null,
              uuid: agent.uuid || agent.ItemID || agent.id || undefined,
            }))
          : [];

        // Merge and deduplicate by UUID or display name
        const byKey = new Map();
        [...staticAgents, ...backendAgents].forEach((a) => {
          const key = a.uuid || a.displayName;
          if (!byKey.has(key)) byKey.set(key, a);
        });

        setAgentsDetails(Array.from(byKey.values()));
      } catch (e) {
        console.error('Failed to load agents:', e);
      } finally {
        setDetailsLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [riotAccount]);

  const agentsPagination = usePagination(agentsDetails, {
    pageSize: PAGE_SIZES.agents,
  });

  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Agents"
          description="See the playable agents available to this account."
          count={agentsDetails.length}
          countLabel="agents"
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading agents..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading agent details...</div>
        )}

        {agentsDetails.length > 0 && (
          <>
          <div id="inventory-agents-grid" className={`${styles.grid} ${styles.gridWide}`}>
            {agentsPagination.items.map((agent, index) => (
              <div key={agent.uuid || agent.ItemID || index} className={styles.card} style={{ padding: 20, contentVisibility: 'auto', containIntrinsicSize: '280px 372px' }}>
                {agent.fullPortrait ? (
                  <img
                    src={agent.fullPortrait}
                    alt={agent.displayName || 'Agent'}
                    loading="lazy"
                    decoding="async"
                    className={`${styles.cardImage} ${styles.cardImageTall}`}
                    style={{ marginBottom: 16 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`${styles.cardImagePlaceholder} ${styles.cardImagePlaceholderTall}`} style={{ marginBottom: 16, fontSize: 48 }}>👤</div>
                )}
                <h3 className={styles.cardName} style={{ fontSize: 18 }}>
                  {agent.displayName || 'Unknown agent'}
                </h3>
                {agent.role && <p className={styles.cardMeta}>{agent.role}</p>}
              </div>
            ))}
          </div>
          <Pagination
            {...agentsPagination}
            onPageChange={agentsPagination.setPage}
            itemLabel="agents"
            scrollTargetId="inventory-agents-grid"
          />
          </>
        )}

        {!detailsLoading && agentsDetails.length === 0 && (
          <div className={styles.emptyState} style={{ marginTop: 24 }}>Agents could not be loaded.</div>
        )}
      </div>
    </>
  );
}
