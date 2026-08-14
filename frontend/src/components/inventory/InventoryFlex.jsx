import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventoryFlex() {
  const { riotAccount, loading, error } = useInventory();
  const [flexDetails, setFlexDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const loadFlexDetails = async () => {
      setDetailsLoading(true);
      try {
        // Read flex entitlement IDs from the Riot account
        const flexItems = riotAccount?.flex?.Entitlements || [];

        // Every account includes this default flex item
        const defaultFlexUuid = 'af52b5a0-4a4c-03b2-c9d7-8187a08a2675';
        const defaultFlexItem = { ItemID: defaultFlexUuid, isDefault: true };

        // Combine the default item with the user's flex items
        const allFlexItems = [defaultFlexItem, ...flexItems];

        console.log('🏆 [InventoryFlex] Flex items found:', flexItems.length);
        console.log('🏆 [InventoryFlex] Default flex added:', defaultFlexUuid);
        console.log('🏆 [InventoryFlex] Total items to process:', allFlexItems.length);

        // Fetch each flex item from its dedicated Valorant API endpoint
        const flexPromises = allFlexItems.map(async (item) => {
          try {
            const itemType = item.isDefault ? 'DEFAULT FLEX' : 'USER FLEX';
            console.log(`🏆 [InventoryFlex] Loading details for ${itemType}:`, item.ItemID);

            const response = await fetch(`https://valorant-api.com/v1/flex/${item.ItemID}`);

            if (!response.ok) {
              console.log('🏆 [InventoryFlex] Request failed for', item.ItemID, 'status:', response.status);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 200 && data.data) {
              console.log('🏆 [InventoryFlex] Details loaded for', item.ItemID, ':', {
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
              console.log('🏆 [InventoryFlex] No data found for', item.ItemID);
              throw new Error('No data found');
            }
          } catch (error) {
            console.error(`🏆 [InventoryFlex] Failed to load flex item ${item.ItemID}:`, error);
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

        console.log('🏆 [InventoryFlex] Final results:', results.length, 'items processed');
        console.log('🏆 [InventoryFlex] Default flex items:', defaultItems);
        console.log('🏆 [InventoryFlex] User flex items:', userItems);
        console.log('🏆 [InventoryFlex] Items with details:', results.filter(r => r.displayIcon).length);
        setFlexDetails(results);
      } catch (e) {
        console.error('Failed to load flex details:', e);
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
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Flex"
          description="Browse the flex items unlocked for this account."
          count={flexDetails.length}
          countLabel="items"
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading flex items..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading flex item details...</div>
        )}

        {flexDetails.length > 0 && (
          <div className={styles.grid}>
            {flexDetails.map((flexItem, index) => (
              <div
                key={flexItem.ItemID || index}
                className={styles.card}
                style={{ minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', contentVisibility: 'auto', containIntrinsicSize: '200px 280px' }}
              >
                {flexItem.displayIcon ? (
                  <img
                    src={flexItem.displayIcon}
                    alt={flexItem.displayName || 'Flex Item'}
                    loading="lazy"
                    decoding="async"
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
                {flexItem.description && (
                  <p className={styles.cardDesc}>{flexItem.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!detailsLoading && flexDetails.length === 0 && (
          <div className={styles.emptyState} style={{ marginTop: 24 }}>No flex items were found.</div>
        )}
      </div>
    </>
  );
}
