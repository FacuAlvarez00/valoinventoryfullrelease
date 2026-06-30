import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';

export default function InventorySprays() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [spraysDetails, setSpraysDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🎨 [InventorySprays] ===== COMPONENTE MONTADO =====');
    console.log('🎨 [InventorySprays] riotAccount:', riotAccount);
    console.log('🎨 [InventorySprays] loading:', loading);
    console.log('🎨 [InventorySprays] error:', error);

    if (riotAccount) {
      console.log('🎨 [InventorySprays] Propiedades del riotAccount:', Object.keys(riotAccount));
      console.log('🎨 [InventorySprays] ¿Tiene sprays?', 'sprays' in riotAccount);
      console.log('🎨 [InventorySprays] Valor de sprays:', riotAccount.sprays);
      console.log('🎨 [InventorySprays] Tipo de sprays:', typeof riotAccount.sprays);
      console.log('🎨 [InventorySprays] ¿Es array?', Array.isArray(riotAccount.sprays));
      
      if (riotAccount.sprays && Array.isArray(riotAccount.sprays)) {
        console.log('🎨 [InventorySprays] Sprays encontrados:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] Cantidad de Sprays:', riotAccount.sprays.length);
        console.log('🎨 [InventorySprays] Primeros 3 sprays:', riotAccount.sprays.slice(0, 3));
        
        // Los sprays ya vienen con detalles del backend, solo los procesamos
        processSpraysDetails();
      } else {
        console.log('🎨 [InventorySprays] No hay sprays válidos en riotAccount');
        console.log('🎨 [InventorySprays] riotAccount.sprays es:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] riotAccount.sprays === null?', riotAccount.sprays === null);
        console.log('🎨 [InventorySprays] riotAccount.sprays === undefined?', riotAccount.sprays === undefined);
        console.log('🎨 [InventorySprays] riotAccount.sprays === []?', JSON.stringify(riotAccount.sprays) === '[]');
      }
    } else {
      console.log('🎨 [InventorySprays] No hay riotAccount');
    }
    console.log('🎨 [InventorySprays] ===== FIN COMPONENTE MONTADO =====');
  }, [riotAccount, loading]);

  const processSpraysDetails = async () => {
    console.log('🎨 [InventorySprays] ===== INICIANDO processSpraysDetails =====');
    console.log('🎨 [InventorySprays] riotAccount existe?', !!riotAccount);
    console.log('🎨 [InventorySprays] riotAccount.sprays existe?', !!(riotAccount && riotAccount.sprays));
    console.log('🎨 [InventorySprays] riotAccount.sprays.length:', riotAccount?.sprays?.length);
    
    if (!riotAccount || !riotAccount.sprays || riotAccount.sprays.length === 0) {
      console.log('🎨 [InventorySprays] No hay sprays para procesar');
      console.log('🎨 [InventorySprays] ===== FIN processSpraysDetails (sin sprays) =====');
      return;
    }

    console.log('🎨 [InventorySprays] Procesando', riotAccount.sprays.length, 'sprays');
    console.log('🎨 [InventorySprays] Primer spray completo:', riotAccount.sprays[0]);
    setDetailsLoading(true);

    try {
      // Los sprays ya vienen con detalles del backend, solo los organizamos
      const details = riotAccount.sprays.map((spray, idx) => {
        console.log(`🎨 [InventorySprays] Procesando spray ${idx + 1}/${riotAccount.sprays.length}:`, {
          ItemID: spray.ItemID,
          displayName: spray.displayName,
          fullTransparentIcon: spray.fullTransparentIcon,
          hasIcon: !!spray.fullTransparentIcon
        });
        
        return {
          ...spray,
          processed: true,
          index: idx
        };
      });

      console.log('🎨 [InventorySprays] Todos los sprays procesados:', details);
      console.log('🎨 [InventorySprays] Cantidad final de detalles:', details.length);
      setSpraysDetails(details);
      
    } catch (error) {
      console.error('🎨 [InventorySprays] Error general en processSpraysDetails:', error);
    } finally {
      setDetailsLoading(false);
      console.log('🎨 [InventorySprays] ===== FIN processSpraysDetails =====');
    }
  };

  // Filtrar sprays basado en el término de búsqueda
  const filteredSprays = spraysDetails.filter(spray =>
    spray.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InventoryNavbar />
      <div style={{ padding: 32, color: '#fff', paddingTop: 90 }}>
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
                Total: {spraysDetails.length}
              </span>
              {searchTerm && (
                <span style={{ 
                  color: '#888', 
                  fontSize: '14px' 
                }}>
                  ({filteredSprays.length} encontrados)
                </span>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Buscar sprays..."
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
        
        <h2 style={{ color: '#ff4655' }}>SPRAYS</h2>
        
        {loading && <LoadingScreen fullscreen={false} text="Cargando sprays..." />}

        {error && (
          <div style={{ 
            color: '#ff4655', 
            textAlign: 'center', 
            marginTop: '50px',
            fontSize: '18px'
          }}>
            Error: {error}
          </div>
        )}

        {!riotAccount && !loading && (
          <div style={{ 
            color: '#fff', 
            textAlign: 'center', 
            marginTop: '50px',
            fontSize: '18px'
          }}>
            No hay cuenta Riot seleccionada
          </div>
        )}

        {riotAccount && !riotAccount.sprays && !loading && (
          <div style={{ 
            color: '#fff', 
            textAlign: 'center', 
            marginTop: '50px',
            fontSize: '18px'
          }}>
            No se encontraron Sprays para esta cuenta
          </div>
        )}
        
        {detailsLoading && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            color: '#ff4655',
            fontSize: '16px'
          }}>
            Cargando detalles de sprays...
          </div>
        )}

        {riotAccount && riotAccount.sprays && riotAccount.sprays.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No tienes Sprays en esta cuenta
          </div>
        )}

        {spraysDetails.length > 0 && filteredSprays.length === 0 && searchTerm ? (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No se encontraron sprays que coincidan con "{searchTerm}"
          </div>
        ) : spraysDetails.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginTop: 20 }}>
            {(() => {
              console.log('🎨 [InventorySprays] RENDERIZANDO SPRAYS');
              console.log('🎨 [InventorySprays] spraysDetails.length:', spraysDetails.length);
              console.log('🎨 [InventorySprays] filteredSprays.length:', filteredSprays.length);
              console.log('🎨 [InventorySprays] searchTerm:', searchTerm);
              console.log('🎨 [InventorySprays] Primeros 3 filteredSprays:', filteredSprays.slice(0, 3));
              return null;
            })()}
            {filteredSprays.map((spray, index) => (
              <div key={spray.ItemID || index} style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                {spray.fullTransparentIcon ? (
                  <img 
                    src={spray.fullTransparentIcon} 
                    alt={spray.displayName || 'Spray'} 
                    style={{ 
                      width: '100%', 
                      height: 120, 
                      objectFit: 'contain',
                      borderRadius: 8,
                      marginBottom: 12,
                      backgroundColor: 'transparent'
                    }}
                    onError={(e) => {
                      console.log('🎨 [InventorySprays] Error cargando imagen:', spray.fullTransparentIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {!spray.fullTransparentIcon && (
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
                    🎨
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
                  {spray.displayName || 'Spray Desconocido'}
                </h3>


              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 