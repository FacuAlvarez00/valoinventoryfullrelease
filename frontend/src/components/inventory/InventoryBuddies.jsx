import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

export default function InventoryBuddies() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [buddies, setBuddies] = useState([]);
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // LOG GLOBAL DEL CONTEXTO
  console.log('RIOT ACCOUNT COMPLETO:', riotAccount);

  useEffect(() => {
    console.log('EJECUTANDO useEffect de buddies');
    const fetchBuddiesDetails = async () => {
      setLoadingBuddies(true);
      try {
        const buddiesFromAccount = riotAccount?.buddies || [];
        console.log('BuddiesFromAccount:', buddiesFromAccount, 'Tipo:', typeof buddiesFromAccount, 'Largo:', buddiesFromAccount.length);
        if (!Array.isArray(buddiesFromAccount) || buddiesFromAccount.length === 0) {
          setBuddies([]);
          setLoadingBuddies(false);
          return;
        }
        // Los gunbuddies ya vienen con detalles completos del backend
        const buddyDetails = buddiesFromAccount.map((item, idx) => {
          console.log(`[${idx}] Gunbuddy con detalles completos:`, item);
          return {
            ...item,
            buddy: {
              displayName: item.displayName,
              displayIcon: item.displayIcon,
              uuid: item.uuid,
              themeUuid: item.themeUuid,
              isHiddenIfNotOwned: item.isHiddenIfNotOwned,
              levels: item.levels,
              ownedLevel: item.ownedLevel
            }
          };
        });
        console.log('BUDDY DETAILS FINAL:', buddyDetails);
        setBuddies(buddyDetails);
      } catch (e) {
        console.error('Error general obteniendo detalles de buddies:', e);
        setBuddies([]);
      }
      setLoadingBuddies(false);
    };
    if (riotAccount) {
      fetchBuddiesDetails();
    }
  }, [riotAccount]);

  // Filtrar buddies basado en el término de búsqueda
  const filteredBuddies = buddies.filter(buddy =>
    buddy.buddy?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skeletons = Array.from({ length: 12 });

  return (
    <>
      <InventoryNavbar />
      <div style={{ padding: 32, color: '#fff', paddingTop: 90, minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <button onClick={() => navigate('/inventory')} style={{ 
            background: '#222b3a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 24px', 
            fontWeight: 'bold', 
            fontSize: 16, 
            cursor: 'pointer', 
            boxShadow: '0 2px 8px #0005' 
          }}>
            ← Volver al Dashboard
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <span style={{ 
                color: '#ff4655', 
                fontWeight: 'bold', 
                fontSize: '14px' 
              }}>
                Total: {buddies.length}
              </span>
              {searchTerm && (
                <span style={{ 
                  color: '#888', 
                  fontSize: '14px' 
                }}>
                  ({filteredBuddies.length} encontrados)
                </span>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Buscar gunbuddies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '14px',
                width: '200px',
                outline: 'none'
              }}
            />
          </div>
        </div>
        
        <h2 style={{ color: '#ff4655', marginBottom: 32 }}>GUNBUDDIES</h2>
        {loading || loadingBuddies ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 20,
            marginTop: 20,
          }}>
            {skeletons.map((_, idx) => (
              <div key={idx} style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #333',
                textAlign: 'center',
                opacity: 0.7,
                animation: 'pulse 1.2s infinite ease-in-out',
              }}>
                {/* Skeleton para la imagen del gunbuddy */}
                <div style={{ 
                  width: '100%', 
                  height: 120, 
                  background: '#333',
                  borderRadius: 8,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {/* Forma del gunbuddy - rectángulo con hook superior */}
                  <div style={{
                    width: '60%',
                    height: '70%',
                    background: '#444a5a',
                    borderRadius: '8px',
                    position: 'relative'
                  }}>
                    {/* Hook superior del gunbuddy */}
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '12px',
                      height: '12px',
                      background: '#444a5a',
                      borderRadius: '50%'
                    }} />
                  </div>
                </div>
                
                {/* Skeleton para el nombre */}
                <div style={{ 
                  width: '80%', 
                  height: 16, 
                  background: '#444a5a', 
                  borderRadius: 4, 
                  margin: '0 auto',
                  opacity: 0.8
                }} />
              </div>
            ))}
            <style>
              {`@keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
              }`}
            </style>
          </div>
        ) : error ? (
          <div style={{ color: '#ff4655', textAlign: 'center' }}>{error}</div>
        ) : buddies.length === 0 ? (
          <div style={{ color: '#fff', textAlign: 'center' }}>No hay Gunbuddies disponibles.</div>
        ) : filteredBuddies.length === 0 && searchTerm ? (
          <div style={{ color: '#fff', textAlign: 'center' }}>No se encontraron gunbuddies que coincidan con "{searchTerm}"</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginTop: 20 }}>
            {filteredBuddies.map((item, index) => (
                             <div key={item.InstanceID || index} style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                {item.buddy?.displayIcon ? (
                  <img 
                    src={item.buddy.displayIcon} 
                    alt={item.buddy.displayName || 'Gunbuddy'} 
                    style={{ 
                      width: '100%', 
                      height: 120, 
                      objectFit: 'contain',
                      borderRadius: 8,
                      marginBottom: 12,
                      backgroundColor: 'transparent'
                    }}
                    onError={(e) => {
                      console.log('🔫 [InventoryBuddies] Error cargando imagen:', item.buddy.displayIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {!item.buddy?.displayIcon && (
                  <div style={{
                    width: '100%',
                    height: 120,
                    background: '#333',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    fontSize: 48,
                    color: '#666'
                  }}>
                    🔫
                  </div>
                )}
                <h3 style={{ 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  margin: '8px 0',
                  color: '#fff',
                  lineHeight: '1.3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  whiteSpace: 'normal',
                  padding: '4px 8px'
                }}>
                  {item.buddy?.displayName || 'Gunbuddy Desconocido'}
                </h3>

              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 