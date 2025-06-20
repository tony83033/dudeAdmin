'use client'

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash, X, Upload, Image as ImageIcon, RefreshCw, Settings } from "lucide-react";
import { fetchImages, deleteImage, uploadImageWithCompression, uploadImageWithoutCompression } from '@/lib/Images/ImagesFun';
import { Image } from '@/types/ImageTypes';
import toast, { Toaster } from 'react-hot-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatFileSize } from '@/lib/utils';

export function ImagesTab() {
  const [images, setImages] = useState<Image[]>([]);
  const [totalImages, setTotalImages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [name, setName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; name: string }[]>([]);

  // Compression settings
  const [enableCompression, setEnableCompression] = useState<boolean>(true);
  const [compressionQuality, setCompressionQuality] = useState<number>(40);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [maxHeight, setMaxHeight] = useState<number>(1080);

  const imagesPerPage = 10;

  const loadImages = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const { images: fetchedImages, total } = await fetchImages({ page, limit: imagesPerPage });
      setImages(fetchedImages);
      setTotalImages(total);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch images.");
    } finally {
      setIsLoading(false);
    }
  }, [imagesPerPage]);

  useEffect(() => {
    loadImages(currentPage);
  }, [currentPage, loadImages]);

  const handleSingleUpload = async () => {
    if (!name || !file) {
      toast.error('Please provide a name and select a file.');
      return;
    }
    setIsUploading(true);
    try {
      if (enableCompression) {
        await uploadImageWithCompression(file, name);
      } else {
        await uploadImageWithoutCompression(file, name);
      }
      toast.success('Image uploaded successfully!');
      setName('');
      setFile(null);
      if (currentPage === 1) {
        await loadImages(1);
      } else {
        setCurrentPage(1);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultiUpload = async () => {
    if (selectedFiles.length === 0 || selectedFiles.some(f => !f.name.trim())) {
      toast.error('Please provide names for all selected files.');
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading(`Uploading 0 of ${selectedFiles.length} images...`);
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      try {
        if (enableCompression) {
          await uploadImageWithCompression(item.file, item.name);
        } else {
          await uploadImageWithoutCompression(item.file, item.name);
        }
        successCount++;
        toast.loading(`Uploading ${i + 1} of ${selectedFiles.length} images...`, { id: toastId });
      } catch (error) {
        toast.error(`Failed to upload ${item.name}`);
      }
    }
    
    toast.dismiss(toastId);
    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} images successfully.`);
    }

    setSelectedFiles([]);
    if (currentPage === 1) {
      await loadImages(1);
    } else {
      setCurrentPage(1);
    }
    setIsUploading(false);
  };
  
  const handleDelete = async (image: Image) => {
    try {
      await deleteImage(image);
      toast.success('Image deleted successfully.');
      if (images.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await loadImages(currentPage);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image.');
    }
  };

  // UI Handlers
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) return toast.error('Please select an image file.');
      if (selected.size > 10 * 1024 * 1024) return toast.error('File size must be less than 10MB.');
      setFile(selected);
    }
  };

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 10 * 1024 * 1024) return false;
      return true;
    });
    const newFiles = files.map(file => ({ file, name: file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-') }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  const updateFileName = (index: number, newName: string) => setSelectedFiles(prev => prev.map((item, i) => i === index ? { ...item, name: newName } : item));
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied!');
  };

  const totalPages = Math.ceil(totalImages / imagesPerPage);

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Images Management</h2>
        <div className="flex items-center gap-2">
            <Badge variant="secondary">{isLoading ? 'Loading...' : `${totalImages} images`}</Badge>
            {totalPages > 1 && <Badge variant="outline">Page {currentPage} of {totalPages}</Badge>}
        </div>
        <Button onClick={() => loadImages(currentPage)} disabled={isLoading} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="single" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Upload</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Upload</TabsTrigger>
          <TabsTrigger value="settings">Compression Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader><CardTitle>Upload Single Image</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input type="text" placeholder="Image Name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
                <Input type="file" accept="image/*" onChange={handleSingleFileChange} className="flex-1" />
                <Button onClick={handleSingleUpload} disabled={isUploading || !name || !file} className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
              {file && (
                <div className="mt-2 text-sm text-muted-foreground">
                  File: {file.name} ({formatFileSize(file.size)})
                  {enableCompression && (
                    <span className="ml-2 text-blue-600">
                      Will be compressed to ~{formatFileSize(file.size * (compressionQuality / 100))}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple">
          <Card>
            <CardHeader><CardTitle>Upload Multiple Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input type="file" accept="image/*" multiple onChange={handleMultiFileChange} className="flex-1" />
                {selectedFiles.length > 0 && (
                  <Button onClick={handleMultiUpload} disabled={isUploading} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
                  </Button>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Selected Files:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1 text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                          {enableCompression && (
                            <span className="ml-1 text-blue-600">
                              → ~{formatFileSize(item.file.size * (compressionQuality / 100))}
                            </span>
                          )}
                        </span>
                        <Input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateFileName(index, e.target.value)}
                          className="w-32 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Compression Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="compression"
                  checked={enableCompression}
                  onCheckedChange={setEnableCompression}
                />
                <Label htmlFor="compression">Enable Image Compression</Label>
              </div>
              
              {enableCompression && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="quality">Quality: {compressionQuality}%</Label>
                    <Input
                      id="quality"
                      type="range"
                      min="10"
                      max="100"
                      value={compressionQuality}
                      onChange={(e) => setCompressionQuality(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxWidth">Max Width (px)</Label>
                      <Input
                        id="maxWidth"
                        type="number"
                        value={maxWidth}
                        onChange={(e) => setMaxWidth(Number(e.target.value))}
                        min="100"
                        max="4000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxHeight">Max Height (px)</Label>
                      <Input
                        id="maxHeight"
                        type="number"
                        value={maxHeight}
                        onChange={(e) => setMaxHeight(Number(e.target.value))}
                        min="100"
                        max="4000"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Quality: {compressionQuality}% (higher = better quality, larger file)</p>
                    <p>• Max dimensions: {maxWidth}×{maxHeight}px (images will be scaled down if larger)</p>
                    <p>• Format: JPEG (best compression for photos)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Images Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Images ({totalImages})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Compression</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                    </TableRow>
                  ))
                ) : images.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No images found</p>
                        <p className="text-sm text-muted-foreground">Upload your first image above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  images.map((image) => (
                    <TableRow key={image.$id}>
                      <TableCell className="font-medium">{image.name}</TableCell>
                      <TableCell>
                        <img
                          src={image.imageUrl}
                          alt={image.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {image.compressedSize ? (
                            <div>
                              <div>{formatFileSize(image.compressedSize)}</div>
                              {image.originalSize && image.originalSize !== image.compressedSize && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatFileSize(image.originalSize)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {image.compressionRatio ? (
                          <Badge variant="secondary" className="text-xs">
                            {image.compressionRatio}% smaller
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No compression
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(image.imageUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(image)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}