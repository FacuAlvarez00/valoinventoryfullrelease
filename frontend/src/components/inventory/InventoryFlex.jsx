import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton } from '../ui/kit';
import styles from './InventoryList.module.css';

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
      <div className={styles.page}>
        <BackButton onClick={() => navigate('/inventory')} style={{ marginBottom: 24 }}>Volver al Dashboard</BackButton>
        <h2 className={styles.pageTitle}>FLEX</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando flex..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de flex items...</div>
        )}

        {flexDetails.length > 0 && (
          <div className={styles.grid}>
            {flexDetails.map((flexItem, index) => (
              <div
                key={flexItem.ItemID || index}
                className={styles.card}
                style={{ minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                {flexItem.displayIcon ? (
                  <img
                    src={flexItem.displayIcon}
                    alt={flexItem.displayName || 'Flex Item'}
                    className={styles.cardImage}
                    style={{ height: 160 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={styles.cardImagePlaceholder} style={{ height: 160 }}>🏆</div>
                )}
                <h3 className={styles.cardName} style={{ letterSpacing: '0.8px' }}>
                  {flexItem.displayName || 'FLEX ITEM'}
                </h3>
                {flexItem.category && (
                  <p className={styles.cardMeta}>{flexItem.category}</p>
                )}
                {flexItem.description && (
                  <p className={styles.cardDesc}>{flexItem.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!detailsLoading && flexDetails.length === 0 && (
          <div className={styles.emptyState} style={{ marginTop: 24 }}>No se encontraron items de flex.</div>
        )}
      </div>
    </>
  );
}
