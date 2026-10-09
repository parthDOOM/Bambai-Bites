import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlaceTile } from './PlaceTile';
import type { Place } from '../types';
import styles from '../styles/PlaceTile.module.css';

interface SortableTileProps {
  place: Place;
  onEdit: (place: Place) => void;
}

export const SortableTile: React.FC<SortableTileProps> = ({ place, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id, data: { type: 'place', place } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? styles.tileDragging : undefined}
    >
      <PlaceTile place={place} onEdit={() => onEdit(place)} />
    </div>
  );
};
