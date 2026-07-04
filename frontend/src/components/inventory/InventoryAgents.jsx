import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton } from '../ui/kit';
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

  // Mapeo manual de roles en inglés para los 5 agentes predeterminados
  const roleMapping = {
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Initiator', // Sova
    '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sentinel',  // Sage
    'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Duelist',  // Phoenix
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': 'Controller', // Brimstone
    'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Duelist',  // Jett
  };

  // Normalizo el shape a lo que pinta el componente
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map(({ value }) => ({
      uuid: value.uuid,
      displayName: value.displayName,
      fullPortrait: value.fullPortrait, // puede venir null en algunos agentes; el componente ya lo maneja
      role: roleMapping[value.uuid] || value.role?.displayName || null,
      processed: true,
      index: -1, // para distinguir de los del backend si querés
      source: 'static',
    }));
}

export default function InventoryAgents() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [agentsDetails, setAgentsDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Cargo todo: estáticos + (si existen) los del backend
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setDetailsLoading(true);
      try {
        // 1) Traigo los 5 fijos
        const staticAgents = await fetchStaticAgents(signal);

        // 2) Tomo los del backend si existen (ya vienen con detalles según tu comentario)
        const backendAgents = Array.isArray(riotAccount?.agents)
          ? riotAccount.agents.map((agent, idx) => ({
              ...agent,
              processed: true,
              index: idx,
              source: 'backend',
              // normalizo por si el backend trae role como objeto o string
              role:
                typeof agent.role === 'string'
                  ? agent.role
                  : agent.role?.displayName || agent.role || null,
              uuid: agent.uuid || agent.ItemID || agent.id || undefined,
            }))
          : [];

        // 3) Merge con dedupe por uuid/displayName
        const byKey = new Map();
        [...staticAgents, ...backendAgents].forEach((a) => {
          const key = a.uuid || a.displayName;
          if (!byKey.has(key)) byKey.set(key, a);
        });

        setAgentsDetails(Array.from(byKey.values()));
      } catch (e) {
        console.error('Error cargando agentes:', e);
      } finally {
        setDetailsLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [riotAccount]);

  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <BackButton onClick={() => navigate('/inventory')} style={{ marginBottom: 24 }}>Volver al Dashboard</BackButton>
        <h2 className={styles.pageTitle}>AGENTS</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando agentes..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de agents...</div>
        )}

        {agentsDetails.length > 0 && (
          <div className={`${styles.grid} ${styles.gridWide}`}>
            {agentsDetails.map((agent, index) => (
              <div key={agent.uuid || agent.ItemID || index} className={styles.card} style={{ padding: 20 }}>
                {agent.fullPortrait ? (
                  <img
                    src={agent.fullPortrait}
                    alt={agent.displayName || 'Agent'}
                    className={`${styles.cardImage} ${styles.cardImageTall}`}
                    style={{ marginBottom: 16 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`${styles.cardImagePlaceholder} ${styles.cardImagePlaceholderTall}`} style={{ marginBottom: 16, fontSize: 48 }}>👤</div>
                )}
                <h3 className={styles.cardName} style={{ fontSize: 18 }}>
                  {agent.displayName || 'Agent Desconocido'}
                </h3>
                {agent.role && <p className={styles.cardMeta}>{agent.role}</p>}
              </div>
            ))}
          </div>
        )}

        {!detailsLoading && agentsDetails.length === 0 && (
          <div className={styles.emptyState} style={{ marginTop: 24 }}>No se pudieron cargar agentes.</div>
        )}
      </div>
    </>
  );
}
