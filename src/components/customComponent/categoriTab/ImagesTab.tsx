'use client'

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash, X, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";
import { fetchImages, deleteImage, uploadImage } from '@/lib/Images/ImagesFun';
import { Image } from '@/types/ImageTypes';
import toast, { Toaster } from 'react-hot-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ImagesTab() {
  const [images, setImages] = useState<Image[]>([]);
  const [totalImages, setTotalImages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [name, setName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; name: string }[]>([]);

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
      await uploadImage(file, name);
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
        await uploadImage(item.file, item.name);
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
      if (selected.size > 5 * 1024 * 1024) return toast.error('File size must be less than 5MB.');
      setFile(selected);
    }
  };

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Upload</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Upload</TabsTrigger>
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
                  <h3 className="font-medium mb-3">Selected Images ({selectedFiles.length})</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {selectedFiles.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-2 bg-muted/30 rounded-md">
                          <img src={URL.createObjectURL(item.file)} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                          <Input value={item.name} onChange={(e) => updateFileName(index, e.target.value)} placeholder="Image name" className="flex-1" />
                          <Button variant="ghost" size="sm" onClick={() => removeSelectedFile(index)} className="p-2"><X className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>ImageUrl</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
              </TableRow>
            ))
          ) : (
            images.map((image) => (
              <TableRow key={image.$id}>
                <TableCell>{image.$id}</TableCell>
                <TableCell>
                  <img src={image.imageUrl} alt={image.name} className="w-10 h-10 rounded-md object-cover" onError={(e) => { e.currentTarget.src = '/assets/placeholder.png'; }}/>
                </TableCell>
                <TableCell>{image.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{image.imageUrl}</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(image.imageUrl)} className="p-2"><Copy className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(image)} className="p-2"><Trash className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing page {currentPage} of {totalPages} ({totalImages} total images)
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
            <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}