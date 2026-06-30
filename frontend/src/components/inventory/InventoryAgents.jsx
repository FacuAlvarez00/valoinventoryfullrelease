import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';

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
      <div style={{ padding: 32, color: '#fff', paddingTop: 90 }}>
        <button
          onClick={() => navigate('/inventory')}
          style={{
            marginBottom: 24,
            background: '#222b3a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0005',
          }}
        >
          ← Volver al Dashboard
        </button>
        <h2 style={{ color: '#ff4655' }}>AGENTS</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando agentes..." />}

        {error && (
          <div
            style={{
              color: '#ff4655',
              textAlign: 'center',
              marginTop: '50px',
              fontSize: '18px',
            }}
          >
            Error: {error}
          </div>
        )}

        {detailsLoading && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#ff4655',
              fontSize: '16px',
            }}
          >
            Cargando detalles de agents...
          </div>
        )}

        {agentsDetails.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
              marginTop: 20,
            }}
          >
            {agentsDetails.map((agent, index) => (
              <div
                key={agent.uuid || agent.ItemID || index}
                style={{
                  background: '#1a1a1a',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #333',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 70, 85, 0.15)';
                  e.currentTarget.style.borderColor = '#ff4655';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#333';
                }}
              >
                {agent.fullPortrait ? (
                  <img
                    src={agent.fullPortrait}
                    alt={agent.displayName || 'Agent'}
                    style={{
                      width: '100%',
                      height: 280,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      // se cae a la tarjeta placeholder
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 280,
                      background: '#333',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      fontSize: 48,
                      color: '#666',
                    }}
                  >
                    👤
                  </div>
                )}
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    margin: '12px 0 8px 0',
                    color: '#fff',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {agent.displayName || 'Agent Desconocido'}
                </h3>
                {agent.role && (
                  <p
                    style={{
                      fontSize: 14,
                      color: '#888',
                      margin: '0 0 8px 0',
                      fontWeight: '500',
                    }}
                  >
                    {agent.role}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!detailsLoading && agentsDetails.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#ccc',
              marginTop: 24,
            }}
          >
            No se pudieron cargar agentes.
          </div>
        )}
      </div>
    </>
  );
}
