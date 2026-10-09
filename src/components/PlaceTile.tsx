import React, { useEffect, useState } from 'react';
import type { Place } from '../types';
import styles from '../styles/PlaceTile.module.css';
import { loadImage } from '../store';
import { Pencil } from 'lucide-react';

interface PlaceTileProps {
  place: Place;
  onEdit: () => void;
  onView: () => void;
}

export const PlaceTile: React.FC<PlaceTileProps> = ({ place, onEdit, onView }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let active = true;
    if (place.type === 'photo' && place.photoId) {
      loadImage(place.photoId).then((url) => {
        if (active && url) {
          setPhotoUrl(url);
        }
      });
    }
    return () => {
      active = false;
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [place.photoId, place.type]);

  const hasDetails = place.recommendations || place.area || place.notes || place.priceRange;

  const handleTileClick = () => {
    onView();
  };

  const Tooltip = () => {
    if (!hasDetails || !showTooltip) return null;
    return (
      <div className={styles.tooltip}>
        {place.area && <div className={styles.tooltipRow}><strong>Area:</strong> {place.area}</div>}
        {place.recommendations && <div className={styles.tooltipRow}><strong>Try:</strong> {place.recommendations}</div>}
        {place.priceRange && <div className={styles.tooltipRow}><strong>Price:</strong> {place.priceRange}</div>}
        {place.notes && <div className={styles.tooltipRow}><strong>Notes:</strong> {place.notes}</div>}
      </div>
    );
  };

  if (place.type === 'name') {
    return (
      <div
        className={`${styles.tile} ${styles.nameTile}`}
        style={{
          backgroundColor: place.backgroundColor || '#374151',
          color: place.textColor || '#ffffff',
        }}
        onClick={handleTileClick}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setShowTooltip(true); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setShowTooltip(false); }}
      >
        {place.name}
        <button 
          className={styles.editBtn} 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit Place"
        >
          <Pencil size={14} />
        </button>
        <Tooltip />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.tile} ${styles.photoTile}`} 
      onClick={handleTileClick}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setShowTooltip(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setShowTooltip(false); }}
    >
      <div 
        className={styles.photoTitle}
        style={{ color: place.textColor || '#ffffff' }}
      >
        {place.name}
      </div>
      <div className={styles.photoWrapper}>
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className={styles.photo} />
        ) : (
          <div style={{width: '100%', height: '100%', background: 'var(--border-color)'}} />
        )}
      </div>
      <button 
        className={styles.editBtn} 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit Place"
      >
        <Pencil size={14} />
      </button>
      <Tooltip />
    </div>
  );
};
