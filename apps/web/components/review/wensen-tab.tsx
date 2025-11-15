'use client';

import { useState } from 'react';
import type { CustomerExample } from '@brikx/extractor-core/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface WensenTabProps {
  customerExample: CustomerExample;
  onChange: (updated: CustomerExample) => void;
}

export function WensenTab({ customerExample, onChange }: WensenTabProps) {
  const wishes = customerExample.wishes || [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newWish, setNewWish] = useState('');

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(wishes[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const updated = [...wishes];
    updated[editingIndex] = editValue;
    onChange({
      ...customerExample,
      wishes: updated,
    });
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDelete = (index: number) => {
    const updated = wishes.filter((_, i) => i !== index);
    onChange({
      ...customerExample,
      wishes: updated,
    });
  };

  const handleAdd = () => {
    if (!newWish.trim()) return;

    const updated = [...wishes, newWish.trim()];
    onChange({
      ...customerExample,
      wishes: updated,
    });
    setNewWish('');
    setAdding(false);
  };

  const handleCancelAdd = () => {
    setNewWish('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Wishes List */}
      {wishes.length === 0 && !adding && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nog geen wensen geëxtraheerd</p>
        </div>
      )}

      {wishes.map((wish, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            {editingIndex === index ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Annuleer
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Opslaan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm">{wish}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(index)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New Wish */}
      {adding ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Textarea
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                placeholder="Nieuwe wens..."
                className="min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                  <X className="h-4 w-4 mr-1" />
                  Annuleer
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!newWish.trim()}>
                  <Check className="h-4 w-4 mr-1" />
                  Toevoegen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Wens toevoegen
        </Button>
      )}

      {/* Summary */}
      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Totaal: {wishes.length} {wishes.length === 1 ? 'wens' : 'wensen'}
        </p>
      </div>
    </div>
  );
}
