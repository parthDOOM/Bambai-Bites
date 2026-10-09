import React, { useEffect, useState } from 'react';
import type { Place, FoodItem } from '../types';
import { loadImage } from '../store';
import styles from '../styles/PlaceTile.module.css';
import { X, MapPin, Tag } from 'lucide-react';

interface Props {
  place: Place;
  onClose: () => void;
}

const FoodItemView: React.FC<{ item: FoodItem; onImageClick: (url: string) => void }> = ({ item, onImageClick }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (item.photoId) {
      loadImage(item.photoId).then((url) => {
        if (active && url) setPhotoUrl(url);
      });
    }
    return () => { active = false; };
  }, [item.photoId]);

  return (
    <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '16px' }}>{item.name}</h4>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(star => (
            <span key={star} style={{ color: star <= item.stars ? '#eab308' : 'var(--border-color)', fontSize: '16px' }}>
              ★
            </span>
          ))}
        </div>
      </div>
      {photoUrl && (
        <img 
          src={photoUrl} 
          alt={item.name} 
          onClick={() => onImageClick(photoUrl)}
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px', cursor: 'pointer' }} 
        />
      )}
      {item.review && (
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted-text)', lineHeight: 1.5 }}>
          {item.review}
        </p>
      )}
    </div>
  );
};

export const PlaceViewer: React.FC<Props> = ({ place, onClose }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

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
      if (photoUrl && !photoUrl.startsWith('http')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [place.photoId, place.type]);

  return (
    <>
      <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={styles.modalContent} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className={styles.modalHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <h2 className={styles.modalTitle} style={{ fontSize: '24px' }}>{place.name}</h2>
            <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {place.type === 'photo' && photoUrl && (
              <img 
                src={photoUrl} 
                alt={place.name} 
                onClick={() => setFullScreenImage(photoUrl)}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '16px', cursor: 'pointer' }} 
              />
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              {place.area && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--muted-text)', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px' }}>
                  <MapPin size={14} /> {place.area}
                </span>
              )}
              {place.cuisine && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--muted-text)', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px' }}>
                  <Tag size={14} /> {place.cuisine}
                </span>
              )}
              {place.priceRange && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--muted-text)', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px' }}>
                  {place.priceRange}
                </span>
              )}
            </div>

            {place.mapsUrl && (
              <a 
                href={place.mapsUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '12px', color: 'var(--primary-color)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}
              >
                Open in Google Maps ↗
              </a>
            )}

            {place.notes && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted-text)' }}>Personal Notes</h4>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>{place.notes}</p>
              </div>
            )}

            {place.foodItems && place.foodItems.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Food Reviews
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {place.foodItems.map(item => (
                    <FoodItemView key={item.id} item={item} onImageClick={setFullScreenImage} />
                  ))}
                </div>
              </div>
            )}

            {(!place.foodItems || place.foodItems.length === 0) && place.recommendations && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted-text)' }}>Must Try</h4>
                <p style={{ margin: 0, fontSize: '15px' }}>{place.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {fullScreenImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '20px'
          }}
          onClick={() => setFullScreenImage(null)}
        >
          <img 
            src={fullScreenImage} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} 
            alt="Fullscreen View"
          />
          <button 
            onClick={() => setFullScreenImage(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </>
  );
};
