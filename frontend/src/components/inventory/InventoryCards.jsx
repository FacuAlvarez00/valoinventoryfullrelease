import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton, SearchInput, Modal } from '../ui/kit';
import styles from './InventoryList.module.css';

export default function InventoryCards() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [cardsDetails, setCardsDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🃏 [InventoryCards] Componente montado');
    console.log('🃏 [InventoryCards] riotAccount:', riotAccount);
    console.log('🃏 [InventoryCards] loading:', loading);
    console.log('🃏 [InventoryCards] error:', error);

    if (riotAccount) {
      console.log('🃏 [InventoryCards] Propiedades del riotAccount:', Object.keys(riotAccount));
      console.log('🃏 [InventoryCards] ¿Tiene cards?', 'cards' in riotAccount);
      console.log('🃏 [InventoryCards] Valor de cards:', riotAccount.cards);
      console.log('🃏 [InventoryCards] Tipo de cards:', typeof riotAccount.cards);
      console.log('🃏 [InventoryCards] ¿Es array?', Array.isArray(riotAccount.cards));

      if (riotAccount.cards && Array.isArray(riotAccount.cards)) {
        console.log('🃏 [InventoryCards] Cards encontradas:', riotAccount.cards);
        console.log('🃏 [InventoryCards] Cantidad de Cards:', riotAccount.cards.length);

        // Las cards ya vienen con detalles del backend, solo las procesamos
        processCardsDetails();
      } else {
        console.log('🃏 [InventoryCards] No hay cards válidas en riotAccount');
        console.log('🃏 [InventoryCards] riotAccount.cards es:', riotAccount.cards);
      }
    } else {
      console.log('🃏 [InventoryCards] No hay riotAccount');
    }
  }, [riotAccount, loading]);

  const processCardsDetails = async () => {
    if (!riotAccount || !riotAccount.cards || riotAccount.cards.length === 0) {
      console.log('🃏 [InventoryCards] No hay cards para procesar');
      return;
    }

    console.log('🃏 [InventoryCards] Procesando', riotAccount.cards.length, 'cards');
    setDetailsLoading(true);

    try {
      // Las cards ya vienen con detalles del backend, solo las organizamos
      const details = riotAccount.cards.map((card, idx) => {
        console.log(`🃏 [InventoryCards] Procesando card ${idx + 1}/${riotAccount.cards.length}:`, card);

        return {
          ...card,
          processed: true,
          index: idx
        };
      });

      console.log('🃏 [InventoryCards] Todas las cards procesadas:', details);
      setCardsDetails(details);

    } catch (error) {
      console.error('🃏 [InventoryCards] Error general en processCardsDetails:', error);
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

  // Filtrar cards basado en el término de búsqueda
  const filteredCards = cardsDetails.filter(card =>
    card.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <BackButton onClick={() => navigate('/inventory')}>Volver al Dashboard</BackButton>

          <div className={styles.headerRight}>
            <div className={styles.countGroup}>
              <span className={styles.countText}>Total: {cardsDetails.length}</span>
              {searchTerm && <span className={styles.countMuted}>({filteredCards.length} encontradas)</span>}
            </div>
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Buscar cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <h2 className={styles.pageTitle}>CARDS</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando cards..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No hay cuenta Riot seleccionada</div>
        )}

        {riotAccount && !riotAccount.cards && !loading && (
          <div className={styles.emptyState}>No se encontraron Cards para esta cuenta</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de cards...</div>
        )}

        {riotAccount && riotAccount.cards && riotAccount.cards.length === 0 && !loading && (
          <div className={styles.emptyState}>No tienes Cards en esta cuenta</div>
        )}

        {cardsDetails.length > 0 && filteredCards.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No se encontraron cards que coincidan con "{searchTerm}"</div>
        ) : cardsDetails.length > 0 && (
          <div className={`${styles.grid} ${styles.gridWide}`} style={{ gap: 16, maxWidth: 1400, margin: '0 auto' }}>
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
                        Imagen no disponible
                      </div>
                    </div>
                  )}
                  <div className={styles.pcardOverlay} />
                </div>

                <div className={styles.pcardFooter}>
                  <h3 className={styles.pcardName}>{card.displayName || 'Card Desconocida'}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para mostrar las 3 variantes de la card */}
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
                      <div className={styles.pcardModalMissing}>{label} no disponible</div>
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
