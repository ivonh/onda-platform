import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ImagePlus, 
  X, 
  GripVertical, 
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function StyleBookGallery({ photos = [], onChange, maxPhotos = 50 }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxPhotos - photos.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPhotos = [];
    let processed = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPhotos.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: e.target.result,
          name: file.name
        });
        processed++;
        
        if (processed === validFiles.length) {
          onChange([...photos, ...newPhotos]);
          toast.success(`Added ${newPhotos.length} photo${newPhotos.length !== 1 ? 's' : ''}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [photos, maxPhotos, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleRemovePhoto = useCallback((index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
    toast.success('Photo removed');
  }, [photos, onChange]);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newPhotos = [...photos];
      const [draggedItem] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dragOverIndex, 0, draggedItem);
      onChange(newPhotos);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, photos, onChange]);

  const handlePhotoDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  return (
    <Card className="border border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-playfair text-xl flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Style Book
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {photos.length}/{maxPhotos} photos
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="region"
          aria-label="Photo upload area - drag and drop photos or click to browse"
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDraggingOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border/40 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${isDraggingOver ? 'bg-primary/20' : 'bg-muted'}`}>
              <Upload className={`h-8 w-8 ${isDraggingOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-lg font-medium mb-1">
                {isDraggingOver ? 'Drop photos here' : 'Drag & drop photos here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (max 5MB per photo)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= maxPhotos}
                className="border-primary/30 hover:bg-primary/10"
                aria-label="Add photos to your style book"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </div>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Drag photos to reorder them. The first photo will be your main showcase image.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handlePhotoDragOver(e, index)}
                  className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                    draggedIndex === index 
                      ? 'opacity-50 border-primary' 
                      : dragOverIndex === index 
                        ? 'border-primary scale-105' 
                        : 'border-transparent hover:border-primary/30'
                  }`}
                >
                  <img
                    src={photo.url || photo}
                    alt={photo.name || `Style book photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="absolute top-2 left-2 text-white/80">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-black text-xs text-center py-1 font-medium">
                      Main Photo
                    </div>
                  )}
                </div>
              ))}
            </div>

            {photos.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove all photos?')) {
                      onChange([]);
                      toast.success('All photos removed');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
