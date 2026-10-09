import React, { useState, useRef } from 'react';
import type { Place, Tier, TileType } from '../types';
import { saveImage, deleteImage } from '../store';
import styles from '../styles/PlaceTile.module.css';
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
  const [type, setType] = useState<TileType>(place?.type || 'name');
  const [name, setName] = useState(place?.name || '');
  const [tierId, setTierId] = useState<string | null>(place?.tierId || null);
  const [backgroundColor, setBackgroundColor] = useState(place?.backgroundColor || '#f97316');
  const [textColor, setTextColor] = useState(place?.textColor || '#ffffff');
  const [photoId] = useState<string | undefined>(place?.photoId);
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

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    let finalPhotoId = photoId;
    
    const file = fileInputRef.current?.files?.[0];
    if (type === 'photo' && file) {
      if (photoId) {
        await deleteImage(photoId); // delete old
      }
      finalPhotoId = await saveImage(file);
    }

    const updatedPlace: Place = {
      id: place?.id || crypto.randomUUID(),
      name,
      type,
      tierId: tierId === 'unranked' ? null : tierId,
      order: place?.order || 0,
      backgroundColor: type === 'name' ? backgroundColor : undefined,
      textColor,
      photoId: type === 'photo' ? finalPhotoId : undefined,
      mapsUrl,
      address,
      area,
      recommendations,
      cuisine,
      priceRange,
      notes,
      foodItems,
    };
    
    onSave(updatedPlace);
    setIsSaving(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isNew ? 'Add Place' : 'Edit Place'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.typeTabs}>
          <button 
            className={`${styles.typeTab} ${type === 'name' ? styles.typeTabActive : ''}`}
            onClick={() => setType('name')}
          >
            Name Tile
          </button>
          <button 
            className={`${styles.typeTab} ${type === 'photo' ? styles.typeTabActive : ''}`}
            onClick={() => setType('photo')}
          >
            Photo Tile
          </button>
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

        {type === 'name' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tile Colors</label>
            <div className={styles.colorPickerRow}>
              <div>
                <label style={{fontSize: '12px', display: 'block'}}>Background</label>
                <input 
                  type="color" 
                  className={styles.colorInput} 
                  value={backgroundColor} 
                  onChange={e => setBackgroundColor(e.target.value)} 
                />
              </div>
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
        )}

        {type === 'photo' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Photo</label>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              ref={fileInputRef}
              className={styles.formInput}
            />
            {photoId && !fileInputRef.current?.files?.[0] && (
              <p style={{fontSize: '12px', color: 'var(--muted-text)', marginTop: '4px'}}>Current photo is saved. Uploading a new one will replace it.</p>
            )}
            
            <div className={styles.formGroup} style={{marginTop: '12px'}}>
              <label className={styles.formLabel}>Title Text Color</label>
              <input 
                type="color" 
                className={styles.colorInput} 
                value={textColor} 
                onChange={e => setTextColor(e.target.value)} 
              />
            </div>
          </div>
        )}

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
