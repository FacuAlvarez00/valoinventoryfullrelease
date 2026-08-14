import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { getBattlePassImage, getDefaultBattlePassImage } from '../../data/battlePassImages';
import LoadingScreen from '../ui/LoadingScreen';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventoryBattlepass() {
  const { riotAccount, loading, error } = useInventory();
  const [battlePassesDetails, setBattlePassesDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    console.log('🎮 [InventoryBattlepass] Component mounted');
    console.log('🎮 [InventoryBattlepass] riotAccount:', riotAccount);
    console.log('🎮 [InventoryBattlepass] loading:', loading);
    console.log('🎮 [InventoryBattlepass] error:', error);

    if (riotAccount && riotAccount.battlePasses) {
      console.log('🎮 [InventoryBattlepass] Battle passes found:', riotAccount.battlePasses);
      console.log('🎮 [InventoryBattlepass] Battle pass count:', riotAccount.battlePasses.length);

      fetchBattlePassesDetails();
    } else {
      console.log('🎮 [InventoryBattlepass] No battle passes or Riot account are available');
    }
  }, [riotAccount, loading]);

  // Return the chronological order of a battle pass
  const getBattlePassOrder = (displayName) => {
    if (!displayName) return 999; // Unknown entries go last

    const name = displayName.toUpperCase();

    // Episode 01: IGNITION (oldest first)
    if (name.includes('IGNITION')) {
      if (name.includes('ACT 1')) return 1;
      if (name.includes('ACT 2')) return 2;
      if (name.includes('ACT 3')) return 3;
      return 10;
    }

    // Episode 02: FORMATION
    if (name.includes('FORMATION')) {
      if (name.includes('ACT 1')) return 11;
      if (name.includes('ACT 2')) return 12;
      if (name.includes('ACT 3')) return 13;
      return 20;
    }

    // Episode 03: REFLECTION
    if (name.includes('REFLECTION')) {
      if (name.includes('ACT 1')) return 21;
      if (name.includes('ACT 2')) return 22;
      if (name.includes('ACT 3')) return 23;
      return 30;
    }

    // Episode 04: DISRUPTION
    if (name.includes('DISRUPTION')) {
      if (name.includes('ACT 1')) return 31;
      if (name.includes('ACT 2')) return 32;
      if (name.includes('ACT 3')) return 33;
      return 40;
    }

    // Episode 05: DIMENSION
    if (name.includes('DIMENSION')) {
      if (name.includes('ACT 1')) return 41;
      if (name.includes('ACT 2')) return 42;
      if (name.includes('ACT 3')) return 43;
      return 50;
    }

    // Episode 06: REVELATION
    if (name.includes('REVELATION')) {
      if (name.includes('ACT 1')) return 51;
      if (name.includes('ACT 2')) return 52;
      if (name.includes('ACT 3')) return 53;
      return 60;
    }

    // Episode 07: EVOLUTION
    if (name.includes('EVOLUTION')) {
      if (name.includes('ACT 1')) return 61;
      if (name.includes('ACT 2')) return 62;
      if (name.includes('ACT 3')) return 63;
      return 70;
    }

    // Episode 08: DEFIANCE
    if (name.includes('DEFIANCE')) {
      if (name.includes('ACT 1')) return 71;
      if (name.includes('ACT 2')) return 72;
      if (name.includes('ACT 3')) return 73;
      return 80;
    }

    // Episode 09: COLLISION
    if (name.includes('COLLISION')) {
      if (name.includes('ACT 1')) return 81;
      if (name.includes('ACT 2')) return 82;
      if (name.includes('ACT 3')) return 83;
      return 90;
    }

    // Season 2025 (most recent)
    if (name.includes('SEASON 2025')) {
      if (name.includes('ACT I') || name.includes('ACT 1')) return 91;
      if (name.includes('ACT II') || name.includes('ACT 2')) return 92;
      if (name.includes('ACT III') || name.includes('ACT 3')) return 93;
      if (name.includes('ACT IV') || name.includes('ACT 4')) return 94;
      if (name.includes('ACT V') || name.includes('ACT 5')) return 95;
      return 100;
    }

    return 999; // Unknown entries go last
  };

  const fetchBattlePassesDetails = async () => {
    if (!riotAccount || !riotAccount.battlePasses || riotAccount.battlePasses.length === 0) {
      console.log('🎮 [InventoryBattlepass] No battle passes to process');
      return;
    }

    console.log('🎮 [InventoryBattlepass] Loading details for', riotAccount.battlePasses.length, 'battle passes');
    setDetailsLoading(true);

    try {
      const details = await Promise.all(riotAccount.battlePasses.map(async (battlePass, idx) => {
        console.log(`🎮 [InventoryBattlepass] Processing battle pass ${idx + 1}/${riotAccount.battlePasses.length}:`, battlePass);

        try {
          // Fetch battle pass details from the Valorant API
          console.log(`🎮 [InventoryBattlepass] [${idx}] Loading details for battle pass ItemID:`, battlePass.ItemID);

          // Correct a known invalid ItemID
          let itemIdToUse = battlePass.ItemID;
          if (battlePass.ItemID === 'b0bd7062-4d62-1ff1-7920-b39622ee926b') {
            console.log(`🎮 [InventoryBattlepass] [${idx}] Replacing a known invalid ItemID`);
            itemIdToUse = 'd5af63c8-495e-00c9-6f89-d1a6bfd670f5';
            console.log(`🎮 [InventoryBattlepass] [${idx}] ItemID changed from ${battlePass.ItemID} to ${itemIdToUse}`);
          }

          // Use the contracts endpoint for battle pass metadata
          let battlePassDetails = null;
          try {
            const res = await fetch(`https://valorant-api.com/v1/contracts/${itemIdToUse}`);
            const data = await res.json();
            console.log(`🎮 [InventoryBattlepass] [${idx}] Contracts API response for`, itemIdToUse, ':', data);
            if (data?.data) {
              battlePassDetails = data.data;
            }
          } catch (error) {
            console.log(`🎮 [InventoryBattlepass] [${idx}] Contracts endpoint failed:`, error);
          }

          const detail = {
            ...battlePass,
            battlePassDetails,
            processed: true,
            index: idx,
            order: getBattlePassOrder(battlePassDetails?.displayName)
          };

          console.log(`🎮 [InventoryBattlepass] Battle pass ${idx + 1} processed successfully:`, detail);
          return detail;

        } catch (error) {
          console.error(`🎮 [InventoryBattlepass] Failed to process battle pass ${idx + 1}:`, error);
          return {
            ...battlePass,
            battlePassDetails: null,
            processed: false,
            index: idx,
            error: error.message,
            order: 999 // Failed entries go last
          };
        }
      }));

      console.log('🎮 [InventoryBattlepass] Processed battle passes:', details);

      // Sort chronologically
      const sortedDetails = details.sort((a, b) => a.order - b.order);
      console.log('🎮 [InventoryBattlepass] Chronologically sorted battle passes:', sortedDetails);

      setBattlePassesDetails(sortedDetails);

    } catch (error) {
      console.error('🎮 [InventoryBattlepass] fetchBattlePassesDetails failed:', error);
    } finally {
      setDetailsLoading(false);
    }
  };



  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Battle Passes"
          description="Review the seasonal passes owned by this account."
          count={battlePassesDetails.length || riotAccount?.battlePasses?.length || 0}
          countLabel="passes"
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading battle passes..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No Riot account is selected.</div>
        )}

        {riotAccount && !riotAccount.battlePasses && !loading && (
          <div className={styles.emptyState}>No battle passes were found for this account.</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading battle pass details...</div>
        )}

        {riotAccount && riotAccount.battlePasses && riotAccount.battlePasses.length === 0 && !loading && (
          <div className={styles.emptyState}>This account does not own any battle passes.</div>
        )}

        {battlePassesDetails.length > 0 && (
          <div className={`${styles.grid} ${styles.gridBP}`}>
            {battlePassesDetails.map((bp, index) => (
              <div key={bp.ItemID || index} className={styles.bpCard}>
                <div className={styles.bpImageWrap}>
                  {(() => {
                    const battlePassName = bp.battlePassDetails?.displayName;
                    const imageSrc = getBattlePassImage(battlePassName) || getDefaultBattlePassImage();
                    return (
                      <img
                        src={imageSrc}
                        alt={battlePassName || 'Battle Pass'}
                        loading="lazy"
                        decoding="async"
                        className={styles.bpImage}
                        onError={(e) => { e.target.src = getDefaultBattlePassImage(); }}
                      />
                    );
                  })()}
                </div>

                <h3 className={styles.bpName}>
                  {bp.battlePassDetails?.displayName || `Battle Pass #${index + 1}`}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
