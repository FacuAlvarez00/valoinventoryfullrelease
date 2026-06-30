import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';

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
      <div style={{ padding: 32, color: '#fff', paddingTop: 90 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <button 
            onClick={() => navigate('/inventory')} 
            style={{ 
              background: '#222b3a', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '8px 24px', 
              fontWeight: 'bold', 
              fontSize: 16, 
              cursor: 'pointer', 
              boxShadow: '0 2px 8px #0005' 
            }}
          >
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
                Total: {cardsDetails.length}
              </span>
              {searchTerm && (
                <span style={{ 
                  color: '#888', 
                  fontSize: '14px' 
                }}>
                  ({filteredCards.length} encontradas)
                </span>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Buscar cards..."
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
        
        <h2 style={{ color: '#ff4655', marginBottom: '20px' }}>CARDS</h2>
        
        {loading && <LoadingScreen fullscreen={false} text="Cargando cards..." />}

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

        {riotAccount && !riotAccount.cards && !loading && (
          <div style={{ 
            color: '#fff', 
            textAlign: 'center', 
            marginTop: '50px',
            fontSize: '18px'
          }}>
            No se encontraron Cards para esta cuenta
          </div>
        )}
        
        {detailsLoading && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            color: '#ff4655',
            fontSize: '16px'
          }}>
            Cargando detalles de cards...
          </div>
        )}

        {riotAccount && riotAccount.cards && riotAccount.cards.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No tienes Cards en esta cuenta
          </div>
        )}

        {cardsDetails.length > 0 && filteredCards.length === 0 && searchTerm ? (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No se encontraron cards que coincidan con "{searchTerm}"
          </div>
        ) : cardsDetails.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            justifyContent: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {filteredCards.map((card, index) => (
              <div 
                key={card.ItemID || index} 
                style={{ 
                  background: '#1a2636', 
                  borderRadius: '12px', 
                  padding: '0', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '1px solid #333',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => openModal(card)}
                onMouseEnter={(e) => {
                  const imageElement = e.currentTarget.querySelector('img');
                  if (imageElement) {
                    imageElement.style.filter = 'brightness(0.7) saturate(0.8)';
                    imageElement.style.transition = 'filter 0.3s ease';
                  }
                }}
                onMouseLeave={(e) => {
                  const imageElement = e.currentTarget.querySelector('img');
                  if (imageElement) {
                    imageElement.style.filter = 'brightness(1) saturate(1)';
                  }
                }}
              >
                {/* Imagen de la card */}
                <div style={{ position: 'relative', height: 'auto', overflow: 'hidden' }}>
                  {card.largeArt ? (
                    <img 
                      src={card.largeArt} 
                      alt={card.displayName || 'Card'} 
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        transition: 'filter 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '200px', 
                      background: 'linear-gradient(135deg, #333 0%, #444 100%)', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>🃏</div>
                        Imagen no disponible
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay con gradiente sutil */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    pointerEvents: 'none'
                  }} />
                </div>
                
                {/* Información de la card */}
                <div style={{ 
                  padding: '12px',
                  background: 'linear-gradient(135deg, #1a2636 0%, #222b3a 100%)'
                }}>
                  <h3 style={{ 
                    color: '#ff4655', 
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {card.displayName || 'Card Desconocida'}
                  </h3>
                  

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para mostrar las 3 variantes de la card */}
        {modalOpen && selectedCard && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeModal}
          >
            <div style={{
              background: '#1a2636',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              border: '1px solid #333',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cerrar */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#ff4655',
                  fontSize: '24px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  zIndex: 1
                }}
              >
                ×
              </button>

              {/* Título */}
              <h2 style={{
                color: '#ff4655',
                textAlign: 'center',
                marginBottom: '30px',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {selectedCard.displayName}
              </h2>

              {/* Contenedor de las 3 variantes */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                justifyContent: 'center',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
              }}>
                {/* SmallArt */}
                <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
                  <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>Small Art</h3>
                  {selectedCard.smallArt ? (
                                         <img
                       src={selectedCard.smallArt}
                       alt={`${selectedCard.displayName} - Small`}
                       style={{
                         width: 'auto',
                         maxWidth: '100%',
                         maxHeight: '300px',
                         borderRadius: '8px',
                         border: '2px solid #333'
                       }}
                     />
                  ) : (
                    <div style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '200px',
                      background: '#333',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      border: '2px solid #333'
                    }}>
                      Small Art no disponible
                    </div>
                  )}
                </div>

                {/* LargeArt */}
                <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
                  <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>Large Art</h3>
                  {selectedCard.largeArt ? (
                                         <img
                       src={selectedCard.largeArt}
                       alt={`${selectedCard.displayName} - Large`}
                       style={{
                         width: 'auto',
                         maxWidth: '100%',
                         maxHeight: '300px',
                         borderRadius: '8px',
                         border: '2px solid #333'
                       }}
                     />
                  ) : (
                    <div style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '200px',
                      background: '#333',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      border: '2px solid #333'
                    }}>
                      Large Art no disponible
                    </div>
                  )}
                </div>

                {/* WideArt */}
                <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
                  <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>Wide Art</h3>
                  {selectedCard.wideArt ? (
                                         <img
                       src={selectedCard.wideArt}
                       alt={`${selectedCard.displayName} - Wide`}
                       style={{
                         width: 'auto',
                         maxWidth: '100%',
                         maxHeight: '300px',
                         borderRadius: '8px',
                         border: '2px solid #333'
                       }}
                     />
                  ) : (
                    <div style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '200px',
                      background: '#333',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      border: '2px solid #333'
                    }}>
                      Wide Art no disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 