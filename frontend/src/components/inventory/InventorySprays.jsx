import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton, SearchInput } from '../ui/kit';
import styles from './InventoryList.module.css';

export default function InventorySprays() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [spraysDetails, setSpraysDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🎨 [InventorySprays] ===== COMPONENTE MONTADO =====');
    console.log('🎨 [InventorySprays] riotAccount:', riotAccount);
    console.log('🎨 [InventorySprays] loading:', loading);
    console.log('🎨 [InventorySprays] error:', error);

    if (riotAccount) {
      console.log('🎨 [InventorySprays] Propiedades del riotAccount:', Object.keys(riotAccount));
      console.log('🎨 [InventorySprays] ¿Tiene sprays?', 'sprays' in riotAccount);
      console.log('🎨 [InventorySprays] Valor de sprays:', riotAccount.sprays);
      console.log('🎨 [InventorySprays] Tipo de sprays:', typeof riotAccount.sprays);
      console.log('🎨 [InventorySprays] ¿Es array?', Array.isArray(riotAccount.sprays));

      if (riotAccount.sprays && Array.isArray(riotAccount.sprays)) {
        console.log('🎨 [InventorySprays] Sprays encontrados:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] Cantidad de Sprays:', riotAccount.sprays.length);
        console.log('🎨 [InventorySprays] Primeros 3 sprays:', riotAccount.sprays.slice(0, 3));

        // Los sprays ya vienen con detalles del backend, solo los procesamos
        processSpraysDetails();
      } else {
        console.log('🎨 [InventorySprays] No hay sprays válidos en riotAccount');
        console.log('🎨 [InventorySprays] riotAccount.sprays es:', riotAccount.sprays);
        console.log('🎨 [InventorySprays] riotAccount.sprays === null?', riotAccount.sprays === null);
        console.log('🎨 [InventorySprays] riotAccount.sprays === undefined?', riotAccount.sprays === undefined);
        console.log('🎨 [InventorySprays] riotAccount.sprays === []?', JSON.stringify(riotAccount.sprays) === '[]');
      }
    } else {
      console.log('🎨 [InventorySprays] No hay riotAccount');
    }
    console.log('🎨 [InventorySprays] ===== FIN COMPONENTE MONTADO =====');
  }, [riotAccount, loading]);

  const processSpraysDetails = async () => {
    console.log('🎨 [InventorySprays] ===== INICIANDO processSpraysDetails =====');
    console.log('🎨 [InventorySprays] riotAccount existe?', !!riotAccount);
    console.log('🎨 [InventorySprays] riotAccount.sprays existe?', !!(riotAccount && riotAccount.sprays));
    console.log('🎨 [InventorySprays] riotAccount.sprays.length:', riotAccount?.sprays?.length);

    if (!riotAccount || !riotAccount.sprays || riotAccount.sprays.length === 0) {
      console.log('🎨 [InventorySprays] No hay sprays para procesar');
      console.log('🎨 [InventorySprays] ===== FIN processSpraysDetails (sin sprays) =====');
      return;
    }

    console.log('🎨 [InventorySprays] Procesando', riotAccount.sprays.length, 'sprays');
    console.log('🎨 [InventorySprays] Primer spray completo:', riotAccount.sprays[0]);
    setDetailsLoading(true);

    try {
      // Los sprays ya vienen con detalles del backend, solo los organizamos
      const details = riotAccount.sprays.map((spray, idx) => {
        console.log(`🎨 [InventorySprays] Procesando spray ${idx + 1}/${riotAccount.sprays.length}:`, {
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

      console.log('🎨 [InventorySprays] Todos los sprays procesados:', details);
      console.log('🎨 [InventorySprays] Cantidad final de detalles:', details.length);
      setSpraysDetails(details);

    } catch (error) {
      console.error('🎨 [InventorySprays] Error general en processSpraysDetails:', error);
    } finally {
      setDetailsLoading(false);
      console.log('🎨 [InventorySprays] ===== FIN processSpraysDetails =====');
    }
  };

  // Filtrar sprays basado en el término de búsqueda
  const filteredSprays = spraysDetails.filter(spray =>
    spray.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <BackButton onClick={() => navigate('/inventory')}>Volver al Dashboard</BackButton>

          <div className={styles.headerRight}>
            <div className={styles.countGroup}>
              <span className={styles.countText}>Total: {spraysDetails.length}</span>
              {searchTerm && <span className={styles.countMuted}>({filteredSprays.length} encontrados)</span>}
            </div>
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Buscar sprays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <h2 className={styles.pageTitle}>SPRAYS</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando sprays..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No hay cuenta Riot seleccionada</div>
        )}

        {riotAccount && !riotAccount.sprays && !loading && (
          <div className={styles.emptyState}>No se encontraron Sprays para esta cuenta</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de sprays...</div>
        )}

        {riotAccount && riotAccount.sprays && riotAccount.sprays.length === 0 && !loading && (
          <div className={styles.emptyState}>No tienes Sprays en esta cuenta</div>
        )}

        {spraysDetails.length > 0 && filteredSprays.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No se encontraron sprays que coincidan con "{searchTerm}"</div>
        ) : spraysDetails.length > 0 && (
          <div className={styles.grid}>
            {filteredSprays.map((spray, index) => (
              <div key={spray.ItemID || index} className={styles.card}>
                {spray.fullTransparentIcon ? (
                  <img
                    src={spray.fullTransparentIcon}
                    alt={spray.displayName || 'Spray'}
                    className={styles.cardImage}
                    onError={(e) => {
                      console.log('🎨 [InventorySprays] Error cargando imagen:', spray.fullTransparentIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {!spray.fullTransparentIcon && (
                  <div className={styles.cardImagePlaceholder}>🎨</div>
                )}
                <h3 className={styles.cardName} style={{ whiteSpace: 'normal' }}>
                  {spray.displayName || 'Spray Desconocido'}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
