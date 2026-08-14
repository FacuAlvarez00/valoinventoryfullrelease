import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton, SearchInput } from '../ui/kit';
import styles from './InventoryList.module.css';

export default function InventoryTitles() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [titlesDetails, setTitlesDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🏆 [InventoryTitles] Componente montado');
    console.log('🏆 [InventoryTitles] riotAccount:', riotAccount);
    console.log('🏆 [InventoryTitles] loading:', loading);
    console.log('🏆 [InventoryTitles] error:', error);

    if (riotAccount) {
      console.log('🏆 [InventoryTitles] Propiedades del riotAccount:', Object.keys(riotAccount));
      console.log('🏆 [InventoryTitles] ¿Tiene titles?', 'titles' in riotAccount);
      console.log('🏆 [InventoryTitles] Valor de titles:', riotAccount.titles);
      console.log('🏆 [InventoryTitles] Tipo de titles:', typeof riotAccount.titles);
      console.log('🏆 [InventoryTitles] ¿Es array?', Array.isArray(riotAccount.titles));

      if (riotAccount.titles && Array.isArray(riotAccount.titles)) {
        console.log('🏆 [InventoryTitles] Titles encontrados:', riotAccount.titles);
        console.log('🏆 [InventoryTitles] Cantidad de Titles:', riotAccount.titles.length);

        // Los titles ya vienen con detalles del backend, solo los procesamos
        processTitlesDetails();
      } else {
        console.log('🏆 [InventoryTitles] No hay titles válidos en riotAccount');
        console.log('🏆 [InventoryTitles] riotAccount.titles es:', riotAccount.titles);
      }
    } else {
      console.log('🏆 [InventoryTitles] No hay riotAccount');
    }
  }, [riotAccount, loading]);

  const processTitlesDetails = async () => {
    if (!riotAccount || !riotAccount.titles || riotAccount.titles.length === 0) {
      console.log('🏆 [InventoryTitles] No hay titles para procesar');
      return;
    }

    console.log('🏆 [InventoryTitles] Procesando', riotAccount.titles.length, 'titles');
    setDetailsLoading(true);

    try {
      // Los titles ya vienen con detalles del backend, solo los organizamos
      const details = riotAccount.titles.map((title, idx) => {
        console.log(`🏆 [InventoryTitles] Procesando title ${idx + 1}/${riotAccount.titles.length}:`, title);

        return {
          ...title,
          processed: true,
          index: idx
        };
      });

      console.log('🏆 [InventoryTitles] Todos los titles procesados:', details);
      setTitlesDetails(details);

    } catch (error) {
      console.error('🏆 [InventoryTitles] Error general en processTitlesDetails:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtrar titles basado en el término de búsqueda
  const filteredTitles = titlesDetails.filter(title =>
    title.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <BackButton onClick={() => navigate('/inventory')}>Volver al Dashboard</BackButton>

          <div className={styles.headerRight}>
            <div className={styles.countGroup}>
              <span className={styles.countText}>Total: {titlesDetails.length}</span>
              {searchTerm && <span className={styles.countMuted}>({filteredTitles.length} encontrados)</span>}
            </div>
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Buscar titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <h2 className={styles.pageTitle}>TITLES</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando titles..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No hay cuenta Riot seleccionada</div>
        )}

        {riotAccount && !riotAccount.titles && !loading && (
          <div className={styles.emptyState}>No se encontraron Titles para esta cuenta</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de titles...</div>
        )}

        {riotAccount && riotAccount.titles && riotAccount.titles.length === 0 && !loading && (
          <div className={styles.emptyState}>No tienes Titles en esta cuenta</div>
        )}

        {titlesDetails.length > 0 && filteredTitles.length === 0 && searchTerm && (
          <div className={styles.emptyState}>No se encontraron titles que coincidan con "{searchTerm}"</div>
        )}

        {filteredTitles.length > 0 && (
          <div className={styles.grid}>
            {filteredTitles.map((title, index) => (
              <div key={title.ItemID || index} className={styles.card}>
                <h3 className={styles.cardName}>
                  {title.displayName || 'Title Desconocido'}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
