'use client'

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash, X, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";
import { fetchImages, deleteImage, uploadImage } from '@/lib/Images/ImagesFun';
import { Image } from '@/types/ImageTypes'; // Import Image type
import toast, { Toaster } from 'react-hot-toast';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ImagesTab() {
  const [images, setImages] = useState<Image[]>([]);
  const [name, setName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMultiUploading, setIsMultiUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [imagesPerPage] = useState<number>(10);

  // Fetch images on mount
  useEffect(() => {
    const getImages = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching images...');
        const fetchedImages = await fetchImages();
        console.log('Fetched images:', fetchedImages);
        console.log('Number of images fetched:', fetchedImages.length);
        setImages(fetchedImages);
        
        if (fetchedImages.length === 0) {
          toast.error('No images found in the database');
        } else {
          toast.success(`Loaded ${fetchedImages.length} images`);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to fetch images');
      } finally {
        setIsLoading(false);
      }
    };
    getImages();
  }, []);

  // Refresh images function
  const refreshImages = async () => {
    try {
      setIsLoading(true);
      console.log('Refreshing images...');
      const fetchedImages = await fetchImages();
      console.log('Refreshed images:', fetchedImages);
      console.log('Number of images after refresh:', fetchedImages.length);
      setImages(fetchedImages);
      setCurrentPage(1); // Reset to first page when refreshing
      
      if (fetchedImages.length === 0) {
        toast.error('No images found in the database');
      } else {
        toast.success(`Refreshed: ${fetchedImages.length} images loaded`);
      }
    } catch (error) {
      console.error('Error refreshing images:', error);
      toast.error('Failed to refresh images');
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination calculations
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.ceil(images.length / imagesPerPage);

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Single file upload handlers
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      toast.success('File selected successfully!');
    }
  };

  const handleSingleUpload = async () => {
    if (!name || !file) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    setIsUploading(true);
    try {
      const newImage = await uploadImage(file, name);
      setImages([...images, newImage]);
      setName('');
      setFile(null);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Multiple file upload handlers
  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    const newSelectedFiles = validFiles.map(file => ({
      file,
      name: file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-')
    }));

    setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} files selected`);
    }

    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileName = (index: number, newName: string) => {
    setSelectedFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, name: newName } : item
    ));
  };

  const handleMultiUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (selectedFiles.some(file => !file.name.trim())) {
      toast.error('Please provide names for all images');
      return;
    }

    setIsMultiUploading(true);
    let successCount = 0;
    let failCount = 0;

    const loadingToast = toast.loading(`Uploading 0/${selectedFiles.length} images...`);

    await Promise.all(
      selectedFiles.map(async ({ file, name }, index) => {
        try {
          const newImage = await uploadImage(file, name);
          setImages(prev => [...prev, newImage]);
          successCount++;
          toast.loading(
            `Uploading ${index + 1}/${selectedFiles.length} images...`,
            { id: loadingToast }
          );
        } catch (error) {
          failCount++;
          toast.error(`Failed to upload ${name}`);
        }
      })
    );

    toast.dismiss(loadingToast);
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} images`);
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} images`);
    }

    setSelectedFiles([]);
    setIsMultiUploading(false);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard!');
  };

  // Handle image deletion
  const handleDelete = async (imageId: string) => {
    try {
      await deleteImage(imageId); // Ensure deleteImage accepts imageId
      setImages(images.filter((image) => image.$id !== imageId));
      toast.success('Image deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Skeleton Loader for Table Rows
  const TableSkeleton = () => {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
          </TableRow>
        ))}
      </>
    );
  };

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Images</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {isLoading ? 'Loading...' : `${images.length} images`}
          </span>
          {!isLoading && images.length > 0 && (
            <span className="text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-md">
              Page {currentPage} of {totalPages} ({indexOfFirstImage + 1}-{Math.min(indexOfLastImage, images.length)} of {images.length})
            </span>
          )}
        </div>
        <Button
          onClick={refreshImages}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
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
            <CardHeader>
              <CardTitle>Upload Single Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Image Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleSingleFileChange}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSingleUpload} 
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple">
          <Card>
            <CardHeader>
              <CardTitle>Upload Multiple Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultiFileChange}
                  className="flex-1"
                />
                {selectedFiles.length > 0 && (
                  <Button 
                    onClick={handleMultiUpload} 
                    disabled={isMultiUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isMultiUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
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
                          <img
                            src={URL.createObjectURL(item.file)}
                            alt={item.name}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => updateFileName(index, e.target.value)}
                            placeholder="Image name"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                            className="p-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
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

      {/* Images Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>ImageUrl</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            currentImages.map((image) => (
              <TableRow key={image.$id}>
                <TableCell>{image.$id}</TableCell>
                <TableCell>{image.name}</TableCell>
                <TableCell>
                  <img
                    src={image.imageUrl}
                    alt={image.name}
                    className="w-10 h-10 rounded-md object-cover"
                    onError={(e) => {
                      console.error('Failed to load image:', image.imageUrl);
                      e.currentTarget.src = '/assets/placeholder.png'; // Fallback image
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{image.imageUrl}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(image.imageUrl)}
                      className="p-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{formatDate(new Date(image.createdAt))}</TableCell>
                <TableCell>{formatDate(new Date(image.updatedAt))}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.$id)}
                    className="p-2"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {!isLoading && images.length > imagesPerPage && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstImage + 1} to {Math.min(indexOfLastImage, images.length)} of {images.length} images
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={prevPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}