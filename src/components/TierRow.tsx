import React from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { Tier, Place } from '../types';
import { SortableTile } from './SortableTile';
import styles from '../styles/TierRow.module.css';
import { ArrowUp, ArrowDown, Plus, Pencil } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface TierRowProps {
  tier: Tier;
  places: Place[];
  onPlaceClick: (place: Place) => void;
  onEditTier: (tier: Tier) => void;
  onMoveTierUp: (id: string) => void;
  onMoveTierDown: (id: string) => void;
  onAddTierBelow: (id: string) => void;
}

export const TierRow: React.FC<TierRowProps> = ({
  tier,
  places,
  onPlaceClick,
  onEditTier,
  onMoveTierUp,
  onMoveTierDown,
  onAddTierBelow
}) => {
  // Use Droppable for the container
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: tier.id,
    data: { type: 'tier', tier }
  });

  return (
    <div className={styles.tierRow}>
      <div 
        className={styles.tierLabel} 
        style={{ backgroundColor: tier.color, color: tier.textColor }}
      >
        {tier.name}
        <button 
          className={styles.labelEditor}
          onClick={() => onEditTier(tier)}
          title="Edit tier"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className={styles.tierContent} ref={setDroppableRef}>
        <SortableContext 
          items={places.map(p => p.id)} 
          strategy={rectSortingStrategy}
        >
          {places.map(place => (
            <SortableTile key={place.id} place={place} onEdit={onPlaceClick} />
          ))}
        </SortableContext>
      </div>

      <div className={styles.tierControls}>
        <button className={styles.controlBtn} onClick={() => onMoveTierUp(tier.id)} title="Move up">
          <ArrowUp size={16} />
        </button>
        <button className={styles.controlBtn} onClick={() => onAddTierBelow(tier.id)} title="Add tier below">
          <Plus size={16} />
        </button>
        <button className={styles.controlBtn} onClick={() => onMoveTierDown(tier.id)} title="Move down">
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  );
};
