import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { SearchInput, Pagination } from '../ui/kit';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventorySprays() {
  const { riotAccount, loading, error } = useInventory();
  const [spraysDetails, setSpraysDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🎨 [InventorySprays] ===== COMPONENT MOUNTED =====');
    console.log('🎨 [InventorySprays] riotAccount:', riotAccount);
    console.log('🎨 [InventorySprays] loading:', loading);
    console.log('🎨 [InventorySprays] error:', error);

    if (riotAccount) {
      console.log('🎨 [InventorySprays] Riot account properties:', Object.keys(riotAccount));
      console.log('🎨 [InventorySprays] Has sprays:', 'sprays' in riotAccount);
      console.log('🎨 [InventorySprays] Spray value:', riotAccount.sprays);
      console.log('🎨 [InventorySprays] Spray type:', typeof riotAccount.sprays);
      console.log('🎨 [InventorySprays] Is array:', Array.isArray(riotAccount.sprays));

      if (riotAccount.sprays && Array.isArray(riotAccount.sprays)) {
        console.log('🎨 [InventorySprays] Sprays found:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] Spray count:', riotAccount.sprays.length);
        console.log('🎨 [InventorySprays] First three sprays:', riotAccount.sprays.slice(0, 3));

        // Sprays already include their backend details
        processSpraysDetails();
      } else {
        console.log('🎨 [InventorySprays] No valid sprays found in the Riot account');
        console.log('🎨 [InventorySprays] riotAccount.sprays value:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] riotAccount.sprays === null?', riotAccount.sprays === null);
        console.log('🎨 [InventorySprays] riotAccount.sprays === undefined?', riotAccount.sprays === undefined);
        console.log('🎨 [InventorySprays] riotAccount.sprays === []?', JSON.stringify(riotAccount.sprays) === '[]');
      }
    } else {
      console.log('🎨 [InventorySprays] No Riot account is available');
    }
    console.log('🎨 [InventorySprays] ===== END COMPONENT MOUNT =====');
  }, [riotAccount, loading]);

  const processSpraysDetails = async () => {
    console.log('🎨 [InventorySprays] ===== START processSpraysDetails =====');
    console.log('🎨 [InventorySprays] Riot account exists:', !!riotAccount);
    console.log('🎨 [InventorySprays] riotAccount.sprays exists:', !!(riotAccount && riotAccount.sprays));
    console.log('🎨 [InventorySprays] riotAccount.sprays.length:', riotAccount?.sprays?.length);

    if (!riotAccount || !riotAccount.sprays || riotAccount.sprays.length === 0) {
      console.log('🎨 [InventorySprays] No sprays to process');
      console.log('🎨 [InventorySprays] ===== END processSpraysDetails (no sprays) =====');
      return;
    }

    console.log('🎨 [InventorySprays] Processing', riotAccount.sprays.length, 'sprays');
    console.log('🎨 [InventorySprays] First complete spray:', riotAccount.sprays[0]);
    setDetailsLoading(true);

    try {
      // Normalize the backend spray details
      const details = riotAccount.sprays.map((spray, idx) => {
        console.log(`🎨 [InventorySprays] Processing spray ${idx + 1}/${riotAccount.sprays.length}:`, {
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

      console.log('🎨 [InventorySprays] Processed sprays:', details);
      console.log('🎨 [InventorySprays] Final detail count:', details.length);
      setSpraysDetails(details);

    } catch (error) {
      console.error('🎨 [InventorySprays] processSpraysDetails failed:', error);
    } finally {
      setDetailsLoading(false);
      console.log('🎨 [InventorySprays] ===== END processSpraysDetails =====');
    }
  };

  // Filter sprays by the search term
  const filteredSprays = spraysDetails.filter(spray =>
    spray.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const spraysPagination = usePagination(filteredSprays, {
    pageSize: PAGE_SIZES.sprays,
    resetKey: searchTerm,
  });

  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Sprays"
          description="Browse the sprays unlocked on this account."
          count={spraysDetails.length}
          countLabel="sprays"
          visibleCount={searchTerm ? filteredSprays.length : undefined}
          actions={(
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Search sprays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading sprays..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No Riot account is selected.</div>
        )}

        {riotAccount && !riotAccount.sprays && !loading && (
          <div className={styles.emptyState}>No sprays were found for this account.</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading spray details...</div>
        )}

        {riotAccount && riotAccount.sprays && riotAccount.sprays.length === 0 && !loading && (
          <div className={styles.emptyState}>This account does not own any sprays.</div>
        )}

        {spraysDetails.length > 0 && filteredSprays.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No sprays match "{searchTerm}".</div>
        ) : spraysDetails.length > 0 && (
          <>
          <div id="inventory-sprays-grid" className={styles.grid}>
            {spraysPagination.items.map((spray, index) => (
              <div key={spray.ItemID || index} className={styles.card}>
                {spray.fullTransparentIcon ? (
                  <img
                    src={spray.fullTransparentIcon}
                    alt={spray.displayName || 'Spray'}
                    loading="lazy"
                    decoding="async"
                    className={styles.cardImage}
                    onError={(e) => {
                      console.log('🎨 [InventorySprays] Failed to load image:', spray.fullTransparentIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {!spray.fullTransparentIcon && (
                  <div className={styles.cardImagePlaceholder}>🎨</div>
                )}
                <h3 className={styles.cardName} style={{ whiteSpace: 'normal' }}>
                  {spray.displayName || 'Unknown spray'}
                </h3>
              </div>
            ))}
          </div>
          <Pagination
            {...spraysPagination}
            onPageChange={spraysPagination.setPage}
            itemLabel="sprays"
            scrollTargetId="inventory-sprays-grid"
          />
          </>
        )}
      </div>
    </>
  );
}
