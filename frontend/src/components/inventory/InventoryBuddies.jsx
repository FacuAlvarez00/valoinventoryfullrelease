import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { SearchInput, SkeletonBlock } from '../ui/kit';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventoryBuddies() {
  const { riotAccount, loading, error } = useInventory();
  const [buddies, setBuddies] = useState([]);
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBuddiesDetails = async () => {
      setLoadingBuddies(true);
      try {
        const buddiesFromAccount = riotAccount?.buddies || [];
        if (!Array.isArray(buddiesFromAccount) || buddiesFromAccount.length === 0) {
          setBuddies([]);
          setLoadingBuddies(false);
          return;
        }
        // Gun buddies already include their complete backend details
        const buddyDetails = buddiesFromAccount.map((item) => {
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
        setBuddies(buddyDetails);
      } catch (e) {
        console.error('Failed to load buddy details:', e);
        setBuddies([]);
      }
      setLoadingBuddies(false);
    };
    if (riotAccount) {
      fetchBuddiesDetails();
    }
  }, [riotAccount]);

  // Filter buddies by the search term
  const filteredBuddies = buddies.filter(buddy =>
    buddy.buddy?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skeletons = Array.from({ length: 12 });

  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Gun Buddies"
          description="Browse every weapon charm owned by this account."
          count={buddies.length}
          countLabel="buddies"
          visibleCount={searchTerm ? filteredBuddies.length : undefined}
          actions={(
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Search gun buddies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        />

        {loading || loadingBuddies ? (
          <div className={styles.grid}>
            {skeletons.map((_, idx) => (
              <div key={idx} className={styles.skeletonCard}>
                <SkeletonBlock height={120} radius={2} />
                <SkeletonBlock width="80%" height={16} radius={4} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : buddies.length === 0 ? (
          <div className={styles.emptyState}>No gun buddies are available.</div>
        ) : filteredBuddies.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No gun buddies match "{searchTerm}".</div>
        ) : (
          <div className={styles.grid}>
            {filteredBuddies.map((item, index) => (
              <div key={item.InstanceID || index} className={styles.card}>
                {item.buddy?.displayIcon ? (
                  <img
                    src={item.buddy.displayIcon}
                    alt={item.buddy.displayName || 'Gunbuddy'}
                    loading="lazy"
                    decoding="async"
                    className={styles.cardImage}
                    onError={(e) => {
                      console.log('🔫 [InventoryBuddies] Failed to load image:', item.buddy.displayIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!item.buddy?.displayIcon && (
                  <div className={styles.cardImagePlaceholder}>🔫</div>
                )}
                <h3 className={styles.cardName} style={{ whiteSpace: 'normal' }}>
                  {item.buddy?.displayName || 'Unknown gun buddy'}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
