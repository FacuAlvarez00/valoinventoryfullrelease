import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { BackButton, SearchInput, SkeletonBlock } from '../ui/kit';
import styles from './InventoryList.module.css';

export default function InventoryBuddies() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [buddies, setBuddies] = useState([]);
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // LOG GLOBAL DEL CONTEXTO
  console.log('RIOT ACCOUNT COMPLETO:', riotAccount);

  useEffect(() => {
    console.log('EJECUTANDO useEffect de buddies');
    const fetchBuddiesDetails = async () => {
      setLoadingBuddies(true);
      try {
        const buddiesFromAccount = riotAccount?.buddies || [];
        console.log('BuddiesFromAccount:', buddiesFromAccount, 'Tipo:', typeof buddiesFromAccount, 'Largo:', buddiesFromAccount.length);
        if (!Array.isArray(buddiesFromAccount) || buddiesFromAccount.length === 0) {
          setBuddies([]);
          setLoadingBuddies(false);
          return;
        }
        // Los gunbuddies ya vienen con detalles completos del backend
        const buddyDetails = buddiesFromAccount.map((item, idx) => {
          console.log(`[${idx}] Gunbuddy con detalles completos:`, item);
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
        console.log('BUDDY DETAILS FINAL:', buddyDetails);
        setBuddies(buddyDetails);
      } catch (e) {
        console.error('Error general obteniendo detalles de buddies:', e);
        setBuddies([]);
      }
      setLoadingBuddies(false);
    };
    if (riotAccount) {
      fetchBuddiesDetails();
    }
  }, [riotAccount]);

  // Filtrar buddies basado en el término de búsqueda
  const filteredBuddies = buddies.filter(buddy =>
    buddy.buddy?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skeletons = Array.from({ length: 12 });

  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <BackButton onClick={() => navigate('/inventory')}>Volver al Dashboard</BackButton>

          <div className={styles.headerRight}>
            <div className={styles.countGroup}>
              <span className={styles.countText}>Total: {buddies.length}</span>
              {searchTerm && <span className={styles.countMuted}>({filteredBuddies.length} encontrados)</span>}
            </div>
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder="Buscar gunbuddies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <h2 className={styles.pageTitle}>GUNBUDDIES</h2>

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
          <div className={styles.emptyState}>No hay Gunbuddies disponibles.</div>
        ) : filteredBuddies.length === 0 && searchTerm ? (
          <div className={styles.emptyState}>No se encontraron gunbuddies que coincidan con "{searchTerm}"</div>
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
                      console.log('🔫 [InventoryBuddies] Error cargando imagen:', item.buddy.displayIcon);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!item.buddy?.displayIcon && (
                  <div className={styles.cardImagePlaceholder}>🔫</div>
                )}
                <h3 className={styles.cardName} style={{ whiteSpace: 'normal' }}>
                  {item.buddy?.displayName || 'Gunbuddy Desconocido'}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
