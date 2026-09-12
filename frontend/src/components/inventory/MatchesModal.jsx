import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal, ModalHeader, ModalBody, TacticalButton } from '../ui/kit';
import MatchCard from './MatchCard';
import styles from './InventoryDetails.module.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';
const PAGE_SIZE = 14;
const MAX_EXTRA_PAGES = 5; // "show more" clicks allowed inside the modal

// Full match history, 14 at a time — opens already showing the same 14
// matches Details loaded, and "Show more" pages in 14 more per click (via
// GET .../matches?startIndex=&count=), capped at 5 clicks so a long session
// can't turn into an unbounded string of match-details fetches against Riot.
export default function MatchesModal({ open, onClose, puuid, initialMatches }) {
  const { makeAuthenticatedRequest } = useAuth();
  const [matches, setMatches] = useState(initialMatches);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const [hasMore, setHasMore] = useState(initialMatches.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMatches(initialMatches);
    setPagesLoaded(0);
    setHasMore(initialMatches.length >= PAGE_SIZE);
    setLoadError('');
  }, [open, initialMatches]);

  const handleShowMore = async () => {
    if (loadingMore || pagesLoaded >= MAX_EXTRA_PAGES || !hasMore || !puuid) return;
    setLoadingMore(true);
    setLoadError('');
    try {
      const res = await makeAuthenticatedRequest(
        `${API_BASE}/api/auth/riot/account/${puuid}/matches?startIndex=${matches.length}&count=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (data.success) {
        setMatches(prev => [...prev, ...data.matches]);
        setHasMore(data.hasMore);
        setPagesLoaded(p => p + 1);
      } else {
        setLoadError(data.message || 'Failed to load more matches.');
      }
    } catch (e) {
      setLoadError('A network error occurred while loading more matches.');
    }
    setLoadingMore(false);
  };

  const atCap = pagesLoaded >= MAX_EXTRA_PAGES;

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <ModalHeader title="Match history" subtitle={`${matches.length} competitive match${matches.length === 1 ? '' : 'es'}`} />
      <ModalBody>
        <div className={styles.matchModalList}>
          {matches.map(m => <MatchCard key={m.matchId} match={m} />)}
        </div>

        {loadError && <p className={styles.matchModalError}>{loadError}</p>}

        {hasMore && (
          <TacticalButton
            fullWidth
            style={{ marginTop: 12 }}
            disabled={loadingMore || atCap}
            onClick={handleShowMore}
          >
            {loadingMore ? 'Loading…' : atCap ? `Showing the ${matches.length} most recent` : 'Show more'}
          </TacticalButton>
        )}
      </ModalBody>
    </Modal>
  );
}
