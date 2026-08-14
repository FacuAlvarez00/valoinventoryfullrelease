import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { SearchInput, Modal } from '../ui/kit';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventoryList.module.css';

export default function InventoryCards() {
  const { riotAccount, loading, error } = useInventory();
  const [cardsDetails, setCardsDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🃏 [InventoryCards] Component mounted');
    console.log('🃏 [InventoryCards] riotAccount:', riotAccount);
    console.log('🃏 [InventoryCards] loading:', loading);
    console.log('🃏 [InventoryCards] error:', error);

    if (riotAccount) {
      console.log('🃏 [InventoryCards] Riot account properties:', Object.keys(riotAccount));
      console.log('🃏 [InventoryCards] Has cards:', 'cards' in riotAccount);
      console.log('🃏 [InventoryCards] Card value:', riotAccount.cards);
      console.log('🃏 [InventoryCards] Card type:', typeof riotAccount.cards);
      console.log('🃏 [InventoryCards] Is array:', Array.isArray(riotAccount.cards));

      if (riotAccount.cards && Array.isArray(riotAccount.cards)) {
        console.log('🃏 [InventoryCards] Cards found:', riotAccount.cards);
        console.log('🃏 [InventoryCards] Card count:', riotAccount.cards.length);

        // Cards already include their backend details
        processCardsDetails();
      } else {
        console.log('🃏 [InventoryCards] No valid cards found in the Riot account');
        console.log('🃏 [InventoryCards] riotAccount.cards value:', riotAccount.cards);
      }
    } else {
      console.log('🃏 [InventoryCards] No Riot account is available');
    }
  }, [riotAccount, loading]);

  const processCardsDetails = async () => {
    if (!riotAccount || !riotAccount.cards || riotAccount.cards.length === 0) {
      console.log('🃏 [InventoryCards] No cards to process');
      return;
    }

    console.log('🃏 [InventoryCards] Processing', riotAccount.cards.length, 'cards');
    setDetailsLoading(true);

    try {
      // Normalize the backend card details
      const details = riotAccount.cards.map((card, idx) => {
        console.log(`🃏 [InventoryCards] Processing card ${idx + 1}/${riotAccount.cards.length}:`, card);

        return {
          ...card,
          processed: true,
          index: idx
        };
      });

      console.log('🃏 [InventoryCards] Processed cards:', details);
      setCardsDetails(details);

    } catch (error) {
      console.error('🃏 [InventoryCards] processCardsDetails failed:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openModal = (card) => {
    setSelectedCard(card);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCard(null);
  };

  // Filter cards by the search term
  const filteredCards = cardsDetails.filter(card =>
    card.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className={styles.page}>
        <InventoryCategoryHeader
          title="Player Cards"
          description="Review the player cards collected by this account."
          count={cardsDetails.length}
          countLabel="cards"
          visibleCount={searchTerm ? filteredCards.length : undefined}
          actions={(
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Search player cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        />

        {loading && <LoadingScreen fullscreen={false} text="Loading cards..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No Riot account is selected.</div>
        )}

        {riotAccount && !riotAccount.cards && !loading && (
          <div className={styles.emptyState}>No cards were found for this account.</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Loading card details...</div>
        )}

        {riotAccount && riotAccount.cards && riotAccount.cards.length === 0 && !loading && (
          <div className={styles.emptyState}>This account does not own any cards.</div>
        )}

        {cardsDetails.length > 0 && filteredCards.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No cards match "{searchTerm}".</div>
        ) : cardsDetails.length > 0 && (
          <div className={`${styles.grid} ${styles.gridWide}`}>
            {filteredCards.map((card, index) => (
              <div
                key={card.ItemID || index}
                className={`${styles.card} ${styles.cardClickable} ${styles.pcard}`}
                style={{ padding: 0, overflow: 'hidden' }}
                onClick={() => openModal(card)}
              >
                <div className={styles.pcardWrap}>
                  {card.largeArt ? (
                    <img
                      src={card.largeArt}
                      alt={card.displayName || 'Card'}
                      loading="lazy"
                      decoding="async"
                      className={styles.pcardImg}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className={styles.pcardPlaceholder}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 4 }}>🃏</div>
                        Image unavailable
                      </div>
                    </div>
                  )}
                  <div className={styles.pcardOverlay} />
                </div>

                <div className={styles.pcardFooter}>
                  <h3 className={styles.pcardName}>{card.displayName || 'Unknown card'}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal with the three player card variants */}
        <Modal open={modalOpen && !!selectedCard} onClose={closeModal} maxWidth={1000}>
          {selectedCard && (
            <div className={styles.modalBody}>
              <button className={styles.modalCloseX} onClick={closeModal}>×</button>
              <h2 className={styles.modalTitle}>{selectedCard.displayName}</h2>

              <div className={styles.modalVariantsRow}>
                {[
                  { key: 'smallArt', label: 'Small Art' },
                  { key: 'largeArt', label: 'Large Art' },
                  { key: 'wideArt', label: 'Wide Art' },
                ].map(({ key, label }) => (
                  <div key={key} className={styles.pcardModalVariant}>
                    <h3 className={styles.pcardModalVariantTitle}>{label}</h3>
                    {selectedCard[key] ? (
                      <img
                        src={selectedCard[key]}
                        alt={`${selectedCard.displayName} - ${label}`}
                        className={styles.pcardModalImg}
                      />
                    ) : (
                      <div className={styles.pcardModalMissing}>{label} unavailable</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
