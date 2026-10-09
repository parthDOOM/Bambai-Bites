import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  pointerWithin, 
  KeyboardSensor, 
  PointerSensor,
  useSensor, 
  useSensors, 
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import * as htmlToImage from 'html-to-image';
import { v4 as uuidv4 } from 'uuid';

import type { BoardState, Place, Tier } from './types';
import { loadState, saveState, exportData, importData } from './store';
import { TierRow } from './components/TierRow';
import { PlaceTile } from './components/PlaceTile';
import { SortableTile } from './components/SortableTile';
import { PlaceDetailsEditor } from './components/PlaceDetailsEditor';
import { Download, Upload, Image as ImageIcon, Plus, X } from 'lucide-react';
import styles from './styles/App.module.css';

function App() {
  const [board, setBoard] = useState<BoardState>({ title: '', tiers: [], places: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null | undefined>(undefined);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadState();
    setBoard(s);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveState(board);
    }
  }, [board, isLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTierPlaces = useCallback((tierId: string | null) => {
    return board.places
      .filter(p => p.tierId === tierId)
      .sort((a, b) => a.order - b.order);
  }, [board.places]);

  const unrankedPlaces = getTierPlaces(null);

  // --- Handlers ---
  
  const handleSavePlace = (place: Place) => {
    setBoard(prev => {
      const exists = prev.places.some(p => p.id === place.id);
      let newPlaces;
      if (exists) {
        newPlaces = prev.places.map(p => p.id === place.id ? place : p);
      } else {
        // Find max order in target tier
        const targetPlaces = prev.places.filter(p => p.tierId === place.tierId);
        const maxOrder = targetPlaces.length > 0 ? Math.max(...targetPlaces.map(p => p.order)) : 0;
        place.order = maxOrder + 1;
        newPlaces = [...prev.places, place];
      }
      return { ...prev, places: newPlaces };
    });
    setEditingPlace(undefined);
  };

  const handleDeletePlace = (id: string) => {
    setBoard(prev => ({
      ...prev,
      places: prev.places.filter(p => p.id !== id)
    }));
    setEditingPlace(undefined);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { data } = active;
    if (data.current?.type === 'place') {
      setActivePlace(data.current.place);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActivePlace = active.data.current?.type === 'place';
    const isOverPlace = over.data.current?.type === 'place';
    const isOverTier = over.data.current?.type === 'tier' || over.id === 'unranked';

    if (!isActivePlace) return;

    // Moving place over another place or over an empty tier
    setBoard(prev => {
      const activePlaceIndex = prev.places.findIndex(p => p.id === activeId);
      if (activePlaceIndex === -1) return prev;
      
      const updatedPlaces = [...prev.places];
      const draggedPlace = { ...updatedPlaces[activePlaceIndex] };

      let targetTierId: string | null = null;

      if (isOverPlace) {
        const overPlaceIndex = prev.places.findIndex(p => p.id === overId);
        if (overPlaceIndex === -1) return prev;
        const overPlace = prev.places[overPlaceIndex];
        
        targetTierId = overPlace.tierId;
        
        // If moving to a different container, temporarily put it there for visual feedback
        if (draggedPlace.tierId !== targetTierId) {
           draggedPlace.tierId = targetTierId;
           // We will sort out exact order in DragEnd
           updatedPlaces[activePlaceIndex] = draggedPlace;
           return { ...prev, places: updatedPlaces };
        }
      } else if (isOverTier) {
        targetTierId = over.id === 'unranked' ? null : String(over.id);
        if (draggedPlace.tierId !== targetTierId) {
          draggedPlace.tierId = targetTierId;
          updatedPlaces[activePlaceIndex] = draggedPlace;
          return { ...prev, places: updatedPlaces };
        }
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlace(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActivePlace = active.data.current?.type === 'place';
    
    if (isActivePlace) {
      setBoard(prev => {
        const activeIndex = prev.places.findIndex(p => p.id === activeId);
        if (activeIndex === -1) return prev;
        
        let targetTierId: string | null = null;
        
        const isOverPlace = over.data.current?.type === 'place';
        
        if (isOverPlace) {
          const overPlace = prev.places.find(p => p.id === overId);
          if (overPlace) targetTierId = overPlace.tierId;
        } else {
           targetTierId = over.id === 'unranked' ? null : String(over.id);
        }

        const updatedPlaces = [...prev.places];
        const draggedPlace = { ...updatedPlaces[activeIndex], tierId: targetTierId };
        
        // Now re-calculate orders for the affected tier(s)
        updatedPlaces[activeIndex] = draggedPlace;
        
        // If we drop over a place, insert next to it
        if (isOverPlace) {
           const tierPlaces = updatedPlaces.filter(p => p.tierId === targetTierId).sort((a,b) => a.order - b.order);
           const overIndexInTier = tierPlaces.findIndex(p => p.id === overId);
           const activeIndexInTier = tierPlaces.findIndex(p => p.id === activeId);
           
           const movedTierPlaces = arrayMove(tierPlaces, activeIndexInTier, overIndexInTier);
           
           // Update orders
           movedTierPlaces.forEach((p, i) => {
             const idx = updatedPlaces.findIndex(up => up.id === p.id);
             updatedPlaces[idx] = { ...updatedPlaces[idx], order: i };
           });
        } else {
           // Dropped on empty tier
           const tierPlaces = updatedPlaces.filter(p => p.tierId === targetTierId).sort((a,b) => a.order - b.order);
           tierPlaces.forEach((p, i) => {
             const idx = updatedPlaces.findIndex(up => up.id === p.id);
             updatedPlaces[idx] = { ...updatedPlaces[idx], order: i };
           });
        }

        return { ...prev, places: updatedPlaces };
      });
    }
  };

  const handleExportPng = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    try {
      // Small delay to let styles apply
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await htmlToImage.toPng(boardRef.current, {
        backgroundColor: '#121212',
        style: {
          padding: '20px'
        }
      });
      const link = document.createElement('a');
      link.download = 'bambai-bites-tier-list.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to generate PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const state = await importData(file);
        if (state) {
          setBoard(state);
        } else {
          alert('Invalid backup file');
        }
      }
    };
    input.click();
  };

  // Tier Management
  const moveTier = (tierId: string, direction: -1 | 1) => {
    setBoard(prev => {
      const idx = prev.tiers.findIndex(t => t.id === tierId);
      if (idx < 0) return prev;
      if (idx === 0 && direction === -1) return prev;
      if (idx === prev.tiers.length - 1 && direction === 1) return prev;
      
      const newTiers = [...prev.tiers];
      const temp = newTiers[idx];
      newTiers[idx] = newTiers[idx + direction];
      newTiers[idx + direction] = temp;
      return { ...prev, tiers: newTiers };
    });
  };

  const addTierBelow = (tierId: string) => {
    setBoard(prev => {
      const idx = prev.tiers.findIndex(t => t.id === tierId);
      const newTiers = [...prev.tiers];
      newTiers.splice(idx + 1, 0, {
        id: uuidv4(),
        name: 'New Tier',
        color: '#9ca3af',
        textColor: '#ffffff'
      });
      return { ...prev, tiers: newTiers };
    });
  };

  const handleEditTierSave = (newName: string, newColor: string, newTextColor: string) => {
    if (!editingTier) return;
    setBoard(prev => ({
      ...prev,
      tiers: prev.tiers.map(t => t.id === editingTier.id ? { ...t, name: newName, color: newColor, textColor: newTextColor } : t)
    }));
    setEditingTier(null);
  };
  
  const handleDeleteTier = () => {
    if (!editingTier) return;
    if (!confirm('Delete this tier? Its places will become unranked.')) return;
    setBoard(prev => ({
      ...prev,
      tiers: prev.tiers.filter(t => t.id !== editingTier.id),
      places: prev.places.map(p => p.tierId === editingTier.id ? { ...p, tierId: null } : p)
    }));
    setEditingTier(null);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.branding}>
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="Logo" className={styles.logo} />
          <div className={styles.titleContainer}>
            <input 
              type="text" 
              value={board.title} 
              onChange={e => setBoard(prev => ({...prev, title: e.target.value}))}
              className={styles.titleInput}
            />
            <span className={styles.tagline}>Your personal guide to Mumbai’s best bites.</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => setEditingPlace(null)}>
            <Plus size={18} /> Add Place
          </button>
          <button className={styles.secondaryBtn} onClick={handleExportPng}>
            <ImageIcon size={16} /> Export PNG
          </button>
          <button className={styles.secondaryBtn} onClick={() => exportData(board)}>
            <Download size={16} /> Backup
          </button>
          <button className={styles.secondaryBtn} onClick={handleImport}>
            <Upload size={16} /> Import
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={isExporting ? styles.exporting : ''}>
          <div ref={boardRef} className={styles.boardArea}>
            
            {board.tiers.map(tier => (
              <TierRow 
                key={tier.id}
                tier={tier}
                places={getTierPlaces(tier.id)}
                onPlaceClick={setEditingPlace}
                onEditTier={setEditingTier}
                onMoveTierUp={(id) => moveTier(id, -1)}
                onMoveTierDown={(id) => moveTier(id, 1)}
                onAddTierBelow={addTierBelow}
              />
            ))}

            {!isExporting && (
              <div 
                className={styles.unrankedArea} 
                id="unranked"
              >
                <SortableContext 
                  items={unrankedPlaces.map(p => p.id)} 
                  strategy={rectSortingStrategy}
                >
                  <h3 className={styles.unrankedTitle}>Unranked & Needs a Verdict</h3>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '60px'}}>
                    {unrankedPlaces.map(place => (
                      <SortableTile key={place.id} place={place} onEdit={setEditingPlace} />
                    ))}
                    {unrankedPlaces.length === 0 && (
                      <p style={{color: 'var(--muted-text)', fontSize: '0.9rem', padding: '12px'}}>
                        Add a place to start ranking.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </div>
            )}
            
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
        }}>
          {activePlace ? <PlaceTile place={activePlace} onEdit={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {editingPlace !== undefined && (
        <PlaceDetailsEditor
          place={editingPlace}
          tiers={board.tiers}
          onSave={handleSavePlace}
          onDelete={handleDeletePlace}
          onClose={() => setEditingPlace(undefined)}
        />
      )}

      {editingTier && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditingTier(null); }}>
          <div className={styles.modalContent} style={{maxWidth: '400px'}}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Tier</h2>
              <button className={styles.closeBtn} onClick={() => setEditingTier(null)}><X size={20} /></button>
            </div>
            
            <div className={styles.formGroup} style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500}}>Tier Name</label>
              <input 
                type="text" 
                value={editingTier.name} 
                onChange={e => setEditingTier({...editingTier, name: e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--secondary-bg)', color: 'var(--text-color)'}}
              />
            </div>
            
            <div style={{display: 'flex', gap: '16px', marginBottom: '24px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500}}>Background Color</label>
                <input 
                  type="color" 
                  value={editingTier.color} 
                  onChange={e => setEditingTier({...editingTier, color: e.target.value})}
                  style={{width: '50px', height: '40px', padding: 0, cursor: 'pointer', border: '1px solid var(--border-color)'}}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500}}>Text Color</label>
                <input 
                  type="color" 
                  value={editingTier.textColor} 
                  onChange={e => setEditingTier({...editingTier, textColor: e.target.value})}
                  style={{width: '50px', height: '40px', padding: 0, cursor: 'pointer', border: '1px solid var(--border-color)'}}
                />
              </div>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <button 
                onClick={handleDeleteTier}
                style={{color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}
              >
                Delete Tier
              </button>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  onClick={() => setEditingTier(null)}
                  style={{padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--secondary-bg)', color: 'var(--text-color)', cursor: 'pointer'}}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleEditTierSave(editingTier.name, editingTier.color, editingTier.textColor)}
                  style={{padding: '8px 16px', border: 'none', borderRadius: '4px', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer'}}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
