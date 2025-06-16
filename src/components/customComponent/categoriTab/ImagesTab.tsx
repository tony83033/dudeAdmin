'use client'

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash } from "lucide-react";
import { fetchImages, deleteImage, uploadImage } from '@/lib/Images/ImagesFun';
import { Image } from '@/types/ImageTypes'; // Import Image type
import toast, { Toaster } from 'react-hot-toast';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

export function ImagesTab() {
  const [images, setImages] = useState<Image[]>([]); // Initialize as Image[]
  const [name, setName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state

  // Fetch images on mount
  useEffect(() => {
    const getImages = async () => {
      try {
        const fetchedImages: Image[] = await fetchImages(); // Ensure fetchImages returns Image[]
        setImages(fetchedImages);
        toast.success('Images fetched successfully!');
      } catch (error) {
        toast.error('Failed to fetch images');
      } finally {
        setIsLoading(false); // Set loading to false after fetch
      }
    };
    getImages();
  }, []);

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard!');
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      toast.success('File selected successfully!');
    }
  };

  // Handle image upload
  const handleUpload = async () => {
    if (!name || !file) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    setIsUploading(true);

    try {
      const newImage: Image = await uploadImage(file, name); // Ensure uploadImage returns Image
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
      {/* Add Toaster component for toast notifications */}
      <Toaster position="top-right" />

      <h2 className="text-xl font-semibold mb-4">Images</h2>

      {/* Input Fields */}
      <div className="flex gap-4 mb-6">
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
          onChange={handleFileChange}
          className="flex-1"
        />
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </div>

      {/* Table */}
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
            <TableSkeleton /> // Show skeleton loader while loading
          ) : (
            images.map((image) => (
              <TableRow key={image.$id}>
                <TableCell>{image.$id}</TableCell>
                <TableCell>{image.name}</TableCell>
                <TableCell>
                  <img
                    src={image.imageUrl}
                    alt={image.name}
                    className="w-10 h-10 rounded-md object-cover"
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
    </div>
  );
}