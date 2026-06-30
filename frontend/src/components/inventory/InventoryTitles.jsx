import React, { useEffect, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';

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
      <InventoryNavbar />
      <div style={{ padding: 32, color: '#fff', paddingTop: 90 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <button onClick={() => navigate('/inventory')} style={{ 
            background: '#222b3a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 24px', 
            fontWeight: 'bold', 
            fontSize: 16, 
            cursor: 'pointer', 
            boxShadow: '0 2px 8px #0005' 
          }}>
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
                Total: {titlesDetails.length}
              </span>
              {searchTerm && (
                <span style={{ 
                  color: '#888', 
                  fontSize: '14px' 
                }}>
                  ({filteredTitles.length} encontrados)
                </span>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Buscar titles..."
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
        
        <h2 style={{ color: '#ff4655' }}>TITLES</h2>
        
        {loading && <LoadingScreen fullscreen={false} text="Cargando titles..." />}

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

        {riotAccount && !riotAccount.titles && !loading && (
          <div style={{ 
            color: '#fff', 
            textAlign: 'center', 
            marginTop: '50px',
            fontSize: '18px'
          }}>
            No se encontraron Titles para esta cuenta
          </div>
        )}
        
        {detailsLoading && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            color: '#ff4655',
            fontSize: '16px'
          }}>
            Cargando detalles de titles...
          </div>
        )}

        {riotAccount && riotAccount.titles && riotAccount.titles.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No tienes Titles en esta cuenta
          </div>
        )}

        {titlesDetails.length > 0 && filteredTitles.length === 0 && searchTerm && (
          <div style={{ 
            textAlign: 'center',
            fontSize: '18px',
            color: '#ccc'
          }}>
            No se encontraron titles que coincidan con "{searchTerm}"
          </div>
        )}

        {filteredTitles.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginTop: 20 }}>
            {filteredTitles.map((title, index) => (
              <div key={title.ItemID || index} style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #333',
                textAlign: 'center'
              }}>

                <h3 style={{ 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  margin: '8px 0',
                  color: '#fff',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
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