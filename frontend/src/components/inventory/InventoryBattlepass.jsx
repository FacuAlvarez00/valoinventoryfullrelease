import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { getBattlePassImage, getDefaultBattlePassImage } from '../../data/battlePassImages';
import LoadingScreen from '../ui/LoadingScreen';
import { BackButton } from '../ui/kit';
import styles from './InventoryList.module.css';

export default function InventoryBattlepass() {
  const navigate = useNavigate();
  const { riotAccount, loading, error } = useInventory();
  const [battlePassesDetails, setBattlePassesDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    console.log('🎮 [InventoryBattlepass] Componente montado');
    console.log('🎮 [InventoryBattlepass] riotAccount:', riotAccount);
    console.log('🎮 [InventoryBattlepass] loading:', loading);
    console.log('🎮 [InventoryBattlepass] error:', error);

    if (riotAccount && riotAccount.battlePasses) {
      console.log('🎮 [InventoryBattlepass] Battle Passes encontrados:', riotAccount.battlePasses);
      console.log('🎮 [InventoryBattlepass] Cantidad de Battle Passes:', riotAccount.battlePasses.length);

      fetchBattlePassesDetails();
    } else {
      console.log('🎮 [InventoryBattlepass] No hay battle passes o cuenta Riot');
    }
  }, [riotAccount, loading]);

  // Función para obtener el orden cronológico de los battle passes
  const getBattlePassOrder = (displayName) => {
    if (!displayName) return 999; // Los desconocidos van al final

    const name = displayName.toUpperCase();

    // Episode 01: IGNITION (más antiguo - primero)
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

    // Season 2025 (más reciente - último)
    if (name.includes('SEASON 2025')) {
      if (name.includes('ACT I') || name.includes('ACT 1')) return 91;
      if (name.includes('ACT II') || name.includes('ACT 2')) return 92;
      if (name.includes('ACT III') || name.includes('ACT 3')) return 93;
      if (name.includes('ACT IV') || name.includes('ACT 4')) return 94;
      if (name.includes('ACT V') || name.includes('ACT 5')) return 95;
      return 100;
    }

    return 999; // Desconocidos al final
  };

  const fetchBattlePassesDetails = async () => {
    if (!riotAccount || !riotAccount.battlePasses || riotAccount.battlePasses.length === 0) {
      console.log('🎮 [InventoryBattlepass] No hay battle passes para procesar');
      return;
    }

    console.log('🎮 [InventoryBattlepass] Iniciando fetch de detalles para', riotAccount.battlePasses.length, 'battle passes');
    setDetailsLoading(true);

    try {
      const details = await Promise.all(riotAccount.battlePasses.map(async (battlePass, idx) => {
        console.log(`🎮 [InventoryBattlepass] Procesando battle pass ${idx + 1}/${riotAccount.battlePasses.length}:`, battlePass);

        try {
          // Intentar obtener detalles del battle pass desde la API de Valorant
          console.log(`🎮 [InventoryBattlepass] [${idx}] Obteniendo detalles para battle pass ItemID:`, battlePass.ItemID);

          // EXCEPCIÓN: Convertir ItemID incorrecto a correcto
          let itemIdToUse = battlePass.ItemID;
          if (battlePass.ItemID === 'b0bd7062-4d62-1ff1-7920-b39622ee926b') {
            console.log(`🎮 [InventoryBattlepass] [${idx}] Aplicando excepción: convirtiendo ItemID incorrecto a correcto`);
            itemIdToUse = 'd5af63c8-495e-00c9-6f89-d1a6bfd670f5';
            console.log(`🎮 [InventoryBattlepass] [${idx}] ItemID convertido de ${battlePass.ItemID} a ${itemIdToUse}`);
          }

          // Usar el endpoint de contracts para obtener información del battle pass
          let battlePassDetails = null;
          try {
            const res = await fetch(`https://valorant-api.com/v1/contracts/${itemIdToUse}`);
            const data = await res.json();
            console.log(`🎮 [InventoryBattlepass] [${idx}] Respuesta de API contracts para`, itemIdToUse, ':', data);
            if (data?.data) {
              battlePassDetails = data.data;
            }
          } catch (error) {
            console.log(`🎮 [InventoryBattlepass] [${idx}] Error con endpoint contracts:`, error);
          }

          const detail = {
            ...battlePass,
            battlePassDetails,
            processed: true,
            index: idx,
            order: getBattlePassOrder(battlePassDetails?.displayName)
          };

          console.log(`🎮 [InventoryBattlepass] Battle pass ${idx + 1} procesado exitosamente:`, detail);
          return detail;

        } catch (error) {
          console.error(`🎮 [InventoryBattlepass] Error procesando battle pass ${idx + 1}:`, error);
          return {
            ...battlePass,
            battlePassDetails: null,
            processed: false,
            index: idx,
            error: error.message,
            order: 999 // Los errores van al final
          };
        }
      }));

      console.log('🎮 [InventoryBattlepass] Todos los battle passes procesados:', details);

      // Ordenar por orden cronológico (más reciente primero)
      const sortedDetails = details.sort((a, b) => a.order - b.order);
      console.log('🎮 [InventoryBattlepass] Battle passes ordenados cronológicamente:', sortedDetails);

      setBattlePassesDetails(sortedDetails);

    } catch (error) {
      console.error('🎮 [InventoryBattlepass] Error general en fetchBattlePassesDetails:', error);
    } finally {
      setDetailsLoading(false);
    }
  };



  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <BackButton onClick={() => navigate('/inventory')} style={{ marginBottom: 24 }}>Volver al Dashboard</BackButton>

        {loading && <LoadingScreen fullscreen={false} text="Cargando battle passes..." />}

        {error && <div className={styles.errorState}>Error: {error}</div>}

        {!riotAccount && !loading && (
          <div className={styles.emptyState}>No hay cuenta Riot seleccionada</div>
        )}

        {riotAccount && !riotAccount.battlePasses && !loading && (
          <div className={styles.emptyState}>No se encontraron Battle Passes para esta cuenta</div>
        )}

        {detailsLoading && (
          <div className={styles.loadingNote}>Cargando detalles de battle passes...</div>
        )}

        {riotAccount && riotAccount.battlePasses && riotAccount.battlePasses.length === 0 && !loading && (
          <div className={styles.emptyState}>No tienes Battle Passes en esta cuenta</div>
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
