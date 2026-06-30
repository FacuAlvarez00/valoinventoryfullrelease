import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';

export default function InventoryFlex() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [flexDetails, setFlexDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const loadFlexDetails = async () => {
      setDetailsLoading(true);
      try {
        // Obtener los ItemIDs de flex del riotAccount
        const flexItems = riotAccount?.flex?.Entitlements || [];
        
        // Flex por defecto que todas las cuentas tienen
        const defaultFlexUuid = 'af52b5a0-4a4c-03b2-c9d7-8187a08a2675';
        const defaultFlexItem = { ItemID: defaultFlexUuid, isDefault: true };
        
        // Combinar flex por defecto + flex del usuario
        const allFlexItems = [defaultFlexItem, ...flexItems];
        
        console.log('🏆 [InventoryFlex] Flex items encontrados:', flexItems.length);
        console.log('🏆 [InventoryFlex] Flex por defecto agregado:', defaultFlexUuid);
        console.log('🏆 [InventoryFlex] Total items a procesar:', allFlexItems.length);
        console.log('🏆 [InventoryFlex] Flex data completo:', riotAccount?.flex);

        // Fetch detalles de cada item de flex desde valorant-api.com usando el endpoint específico de flex
        const flexPromises = allFlexItems.map(async (item) => {
          try {
            const itemType = item.isDefault ? 'FLEX POR DEFECTO' : 'FLEX DEL USUARIO';
            console.log(`🏆 [InventoryFlex] Obteniendo detalles para ${itemType}:`, item.ItemID);
            
            const response = await fetch(`https://valorant-api.com/v1/flex/${item.ItemID}`);
            
            if (!response.ok) {
              console.log('🏆 [InventoryFlex] Error en respuesta para', item.ItemID, 'status:', response.status);
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 200 && data.data) {
              console.log('🏆 [InventoryFlex] Datos obtenidos para', item.ItemID, ':', {
                displayNameAllCaps: data.data.displayNameAllCaps,
                displayIcon: data.data.displayIcon,
                displayName: data.data.displayName
              });
              
              return {
                ...item,
                displayName: data.data.displayNameAllCaps || data.data.displayName || 'Flex Item',
                displayIcon: data.data.displayIcon || null,
                description: data.data.description || null,
                category: 'Flex',
                isDefault: item.isDefault || false
              };
            } else {
              console.log('🏆 [InventoryFlex] No se encontraron datos para', item.ItemID);
              throw new Error('No data found');
            }
          } catch (error) {
            console.error(`🏆 [InventoryFlex] Error obteniendo detalles de flex item ${item.ItemID}:`, error);
            return {
              ...item,
              displayName: 'Flex Item',
              displayIcon: null,
              description: null,
              category: 'Flex',
              isDefault: item.isDefault || false
            };
          }
        });

        const results = await Promise.all(flexPromises);
        const defaultItems = results.filter(r => r.isDefault).length;
        const userItems = results.filter(r => !r.isDefault).length;
        
        console.log('🏆 [InventoryFlex] Resultados finales:', results.length, 'items procesados');
        console.log('🏆 [InventoryFlex] - Flex por defecto:', defaultItems);
        console.log('🏆 [InventoryFlex] - Flex del usuario:', userItems);
        console.log('🏆 [InventoryFlex] Items con detalles:', results.filter(r => r.displayIcon).length);
        setFlexDetails(results);
      } catch (e) {
        console.error('Error cargando flex details:', e);
      } finally {
        setDetailsLoading(false);
      }
    };

    if (riotAccount?.flex) {
      loadFlexDetails();
    }
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
        <h2 style={{ color: '#ff4655' }}>FLEX</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando flex..." />}

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
            Cargando detalles de flex items...
          </div>
        )}

        {flexDetails.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 24,
              marginTop: 20,
            }}
          >
            {flexDetails.map((flexItem, index) => (
              <div
                key={flexItem.ItemID || index}
                style={{
                  background: '#1a1a1a',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #333',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  minHeight: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
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
                {flexItem.displayIcon ? (
                  <img
                    src={flexItem.displayIcon}
                    alt={flexItem.displayName || 'Flex Item'}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'contain',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 160,
                      background: '#333',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      fontSize: 48,
                      color: '#666',
                    }}
                  >
                    🏆
                  </div>
                )}
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    margin: '8px 0 6px 0',
                    color: '#fff',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.8,
                    lineHeight: 1.2,
                  }}
                >
                  {flexItem.displayName || 'FLEX ITEM'}
                </h3>
                {flexItem.category && (
                  <p
                    style={{
                      fontSize: 11,
                      color: '#888',
                      margin: '0 0 6px 0',
                      fontWeight: '500',
                    }}
                  >
                    {flexItem.category}
                  </p>
                )}
                {flexItem.description && (
                  <p
                    style={{
                      fontSize: 10,
                      color: '#aaa',
                      margin: '0 0 6px 0',
                      lineHeight: 1.3,
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {flexItem.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!detailsLoading && flexDetails.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#ccc',
              marginTop: 24,
            }}
          >
            No se encontraron items de flex.
          </div>
        )}
      </div>
    </>
  );
}
