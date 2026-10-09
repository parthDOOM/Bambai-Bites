import React, { useState, useRef, useEffect } from 'react';
import type { Place, Tier, TileType } from '../types';
import { saveImage, deleteImage } from '../store';
import styles from '../styles/PlaceTile.module.css';
import appStyles from '../styles/App.module.css';
import { X, Trash2 } from 'lucide-react';

interface Props {
  place: Place | null;
  tiers: Tier[];
  onSave: (place: Place) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const PlaceDetailsEditor: React.FC<Props> = ({ place, tiers, onSave, onDelete, onClose }) => {
  const isNew = !place;
  const [name, setName] = useState(place?.name || '');
  const [tierId, setTierId] = useState<string | null>(place?.tierId || null);
  const [backgroundColor, setBackgroundColor] = useState(place?.backgroundColor || '#f97316');
  const [textColor, setTextColor] = useState(place?.textColor || '#ffffff');
  const [photoId, setPhotoId] = useState<string | undefined>(place?.photoId);
  const [mapsUrl, setMapsUrl] = useState(place?.mapsUrl || '');
  const [address, setAddress] = useState(place?.address || '');
  const [area, setArea] = useState(place?.area || '');
  const [recommendations, setRecommendations] = useState(place?.recommendations || '');
  const [cuisine, setCuisine] = useState(place?.cuisine || '');
  const [priceRange, setPriceRange] = useState(place?.priceRange || '');
  const [notes, setNotes] = useState(place?.notes || '');
  const [foodItems, setFoodItems] = useState(place?.foodItems || []);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleRemovePhoto = () => {
    setPhotoId(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    let finalPhotoId = photoId === 'temp' ? undefined : photoId;
    let computedType: TileType = 'name';
    
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      if (photoId && photoId !== 'temp') {
        await deleteImage(photoId); // delete old
      }
      finalPhotoId = await saveImage(file);
    }

    if (finalPhotoId) computedType = 'photo';

    const updatedPlace: Place = {
      id: place?.id || crypto.randomUUID(),
      name,
      type: computedType,
      tierId: tierId === 'unranked' ? null : tierId,
      order: place?.order || 0,
      backgroundColor: computedType === 'name' ? backgroundColor : undefined,
      textColor,
      photoId: computedType === 'photo' ? finalPhotoId : undefined,
      mapsUrl,
      address,
      area,
      recommendations,
      cuisine,
      priceRange,
      notes,
      foodItems: foodItems.filter(f => f.name.trim() !== '' || !!f.photoId),
    };
    
    onSave(updatedPlace);
    setIsSaving(false);
  };

  return (
    <div 
      className={appStyles.modalOverlay} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={appStyles.modalContent}>
        <div className={appStyles.modalHeader}>
          <h2 className={appStyles.modalTitle}>{isNew ? 'Add Place' : 'Edit Place'}</h2>
          <button className={appStyles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Place Name *</label>
          <input 
            type="text" 
            className={styles.formInput} 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Ashok Vada Pav" 
            autoFocus 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Photo (Optional)</label>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            ref={fileInputRef}
            className={styles.formInput}
            onChange={(e) => {
              if (e.target.files?.[0] && !photoId) {
                // Just trigger re-render to hide background color
                setPhotoId('temp');
              } else if (!e.target.files?.[0] && photoId === 'temp') {
                setPhotoId(undefined);
              }
            }}
          />
          {photoId && (
            <div style={{display: 'flex', alignItems: 'center', marginTop: '8px', gap: '8px'}}>
              <p style={{fontSize: '12px', color: 'var(--primary-color)', margin: 0}}>✓ Photo attached</p>
              <button 
                type="button" 
                onClick={handleRemovePhoto}
                style={{fontSize: '12px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'var(--muted-text)'}}
              >
                Remove
              </button>
            </div>
          )}
          <p style={{fontSize: '12px', color: 'var(--muted-text)', marginTop: '4px'}}>
            {photoId ? 'A photo makes this a Photo Tile.' : 'Leave empty to make a colorful Name Tile.'}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tile Colors</label>
          <div className={styles.colorPickerRow}>
            {!photoId && (
              <div>
                <label style={{fontSize: '12px', display: 'block'}}>Background</label>
                <input 
                  type="color" 
                  className={styles.colorInput} 
                  value={backgroundColor} 
                  onChange={e => setBackgroundColor(e.target.value)} 
                />
              </div>
            )}
            <div>
              <label style={{fontSize: '12px', display: 'block'}}>Text</label>
              <input 
                type="color" 
                className={styles.colorInput} 
                value={textColor} 
                onChange={e => setTextColor(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tier Assignment</label>
          <select 
            className={styles.formSelect} 
            value={tierId || 'unranked'} 
            onChange={e => setTierId(e.target.value)}
          >
            <option value="unranked">Unranked</option>
            {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        
        <hr style={{margin: '24px 0', borderColor: 'var(--border-color)', borderTop: 'none'}} />
        
        <h3 style={{fontSize: '16px', marginBottom: '16px'}}>Optional Details</h3>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>What to eat (Must-try)</label>
          <input 
            type="text" 
            className={styles.formInput} 
            value={recommendations} 
            onChange={e => setRecommendations(e.target.value)} 
            placeholder="e.g. Kanda Poha, Filter Coffee" 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Google Maps Link</label>
          <input 
            type="url" 
            className={styles.formInput} 
            value={mapsUrl} 
            onChange={e => setMapsUrl(e.target.value)} 
            placeholder="https://maps.app.goo.gl/..." 
          />
        </div>

        <div style={{display: 'flex', gap: '16px'}}>
          <div className={styles.formGroup} style={{flex: 1}}>
            <label className={styles.formLabel}>Area / Neighborhood</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={area} 
              onChange={e => setArea(e.target.value)} 
              placeholder="e.g. Bandra West" 
            />
          </div>
          <div className={styles.formGroup} style={{flex: 1}}>
            <label className={styles.formLabel}>Cuisine / Category</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={cuisine} 
              onChange={e => setCuisine(e.target.value)} 
              placeholder="e.g. Street Food" 
            />
          </div>
        </div>

        <div style={{display: 'flex', gap: '16px'}}>
          <div className={styles.formGroup} style={{flex: 1}}>
            <label className={styles.formLabel}>Physical Address</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="Full address..." 
            />
          </div>
          <div className={styles.formGroup} style={{flex: 1}}>
            <label className={styles.formLabel}>Price Range</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={priceRange} 
              onChange={e => setPriceRange(e.target.value)} 
              placeholder="e.g. ₹₹" 
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Personal Notes</label>
          <textarea 
            className={styles.formTextarea} 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder="Best to visit early morning..." 
          />
        </div>

        <hr style={{margin: '24px 0', borderColor: 'var(--border-color)', borderTop: 'none'}} />
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h3 style={{fontSize: '16px', margin: 0}}>Food Items & Reviews</h3>
          <button 
            type="button"
            onClick={() => setFoodItems([...foodItems, { id: crypto.randomUUID(), name: '', review: '', stars: 0 }])}
            style={{padding: '6px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px'}}
          >
            + Add Item
          </button>
        </div>

        {foodItems.map((item, index) => (
          <div key={item.id} style={{padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', marginBottom: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <input 
                type="text" 
                placeholder="Item Name (e.g. Vada Pav)" 
                value={item.name}
                onChange={e => {
                  const newItems = [...foodItems];
                  newItems[index].name = e.target.value;
                  setFoodItems(newItems);
                }}
                className={styles.formInput}
                style={{flex: 1, marginRight: '12px', marginBottom: 0}}
              />
              <button 
                type="button"
                onClick={() => setFoodItems(foodItems.filter(f => f.id !== item.id))}
                style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              placeholder="Your review for this item..." 
              value={item.review}
              onChange={e => {
                const newItems = [...foodItems];
                newItems[index].review = e.target.value;
                setFoodItems(newItems);
              }}
              className={styles.formTextarea}
              style={{minHeight: '60px', marginBottom: '8px'}}
            />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                <span style={{fontSize: '12px', color: 'var(--muted-text)', marginRight: '8px'}}>Rating:</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      const newItems = [...foodItems];
                      newItems[index].stars = star;
                      setFoodItems(newItems);
                    }}
                    style={{
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '18px', 
                      padding: 0,
                      color: star <= item.stars ? '#eab308' : 'var(--border-color)'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{fontSize: '12px'}}>
                <label style={{cursor: 'pointer', color: 'var(--primary-color)'}}>
                  {item.photoId ? '📷 Photo Added (Change)' : '+ Add Photo'}
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp"
                    style={{display: 'none'}}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const id = await saveImage(file);
                        const newItems = [...foodItems];
                        if (newItems[index].photoId) {
                          await deleteImage(newItems[index].photoId!);
                        }
                        newItems[index].photoId = id;
                        setFoodItems(newItems);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}

        <div className={styles.modalActions}>
          {!isNew && (
            <button className={styles.deleteBtn} onClick={() => { if(confirm('Delete this place?')) onDelete(place.id); }}>
              <Trash2 size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/>
              Delete
            </button>
          )}
          <button className={styles.secondaryBtn} style={{background: 'var(--secondary-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px'}} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.primaryBtn} 
            style={{background: 'var(--primary-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px'}} 
            onClick={handleSave} 
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Place'}
          </button>
        </div>
      </div>
    </div>
  );
};
