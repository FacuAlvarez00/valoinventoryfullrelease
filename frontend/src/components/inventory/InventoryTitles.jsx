import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { SearchInput, Pagination } from '../ui/kit';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventoryTitles() {
  const { riotAccount, loading, error } = useInventory();
  const [titlesDetails, setTitlesDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🏆 [InventoryTitles] Component mounted');
    console.log('🏆 [InventoryTitles] riotAccount:', riotAccount);
    console.log('🏆 [InventoryTitles] loading:', loading);
    console.log('🏆 [InventoryTitles] error:', error);

    if (riotAccount) {
      console.log('🏆 [InventoryTitles] Riot account properties:', Object.keys(riotAccount));
      console.log('🏆 [InventoryTitles] Has titles:', 'titles' in riotAccount);
      console.log('🏆 [InventoryTitles] Title value:', riotAccount.titles);
      console.log('🏆 [InventoryTitles] Title type:', typeof riotAccount.titles);
      console.log('🏆 [InventoryTitles] Is array:', Array.isArray(riotAccount.titles));

      if (riotAccount.titles && Array.isArray(riotAccount.titles)) {
        console.log('🏆 [InventoryTitles] Titles found:', riotAccount.titles);
        console.log('🏆 [InventoryTitles] Title count:', riotAccount.titles.length);

        // Titles already include their backend details
        processTitlesDetails();
      } else {
        console.log('🏆 [InventoryTitles] No valid titles found in the Riot account');
        console.log('🏆 [InventoryTitles] riotAccount.titles value:', riotAccount.titles);
      }
    } else {
      console.log('🏆 [InventoryTitles] No Riot account is available');
    }
  }, [riotAccount, loading]);

  const processTitlesDetails = async () => {
    if (!riotAccount || !riotAccount.titles || riotAccount.titles.length === 0) {
      console.log('🏆 [InventoryTitles] No titles to process');
      return;
    }

    console.log('🏆 [InventoryTitles] Processing', riotAccount.titles.length, 'titles');
    setDetailsLoading(true);

    try {
      // Normalize the backend title details
      const details = riotAccount.titles.map((title, idx) => {
        console.log(`🏆 [InventoryTitles] Processing title ${idx + 1}/${riotAccount.titles.length}:`, title);

        return {
          ...title,
          processed: true,
          index: idx
        };
      });

      console.log('🏆 [InventoryTitles] Processed titles:', details);
      setTitlesDetails(details);

    } catch (error) {
      console.error('🏆 [InventoryTitles] processTitlesDetails failed:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filter titles by the search term
  const filteredTitles = titlesDetails.filter(title =>
    title.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const titlesPagination = usePagination(filteredTitles, {
    pageSize: PAGE_SIZES.titles,
    resetKey: searchTerm,
  });

  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Player Titles"
          description="Review every title available to this account."
          count={titlesDetails.length}
          countLabel="titles"
          visibleCount={searchTerm ? filteredTitles.length : undefined}
          actions={(
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Search player titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading titles..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No Riot account is selected.</div>
        )}

        {riotAccount && !riotAccount.titles && !loading && (
          <div className={styles.emptyState}>No titles were found for this account.</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading title details...</div>
        )}

        {riotAccount && riotAccount.titles && riotAccount.titles.length === 0 && !loading && (
          <div className={styles.emptyState}>This account does not own any titles.</div>
        )}

        {titlesDetails.length > 0 && filteredTitles.length === 0 && searchTerm && (
          <div className={styles.emptyState}>No titles match "{searchTerm}".</div>
        )}

        {filteredTitles.length > 0 && (
          <>
          <div id="inventory-titles-grid" className={styles.grid}>
            {titlesPagination.items.map((title, index) => (
              <div key={title.ItemID || index} className={styles.card}>
                <h3 className={styles.cardName}>
                  {title.displayName || 'Unknown title'}
                </h3>
              </div>
            ))}
          </div>
          <Pagination
            {...titlesPagination}
            onPageChange={titlesPagination.setPage}
            itemLabel="titles"
            scrollTargetId="inventory-titles-grid"
          />
          </>
        )}
      </div>
    </>
  );
}
