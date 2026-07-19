"use client";

import { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDropzone } from "react-dropzone";

interface ContractUploaderProps {
  onFileSelected: (file: File) => Promise<void> | void;
}

export function ContractUploader({ onFileSelected }: ContractUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    setProgress(10);

    // Show progress animation while parent uploads
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 12, 90));
    }, 400);

    try {
      await onFileSelected(file);   // Parent handles the actual API call
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card className={`border-dashed border-2 transition-colors ${isDragActive ? "border-blue-400 bg-blue-50/50" : "border-muted-foreground/25"}`}>
      <CardContent className="flex flex-col items-center justify-center p-16 text-center">
        {!isUploading ? (
          <div {...getRootProps()} className="cursor-pointer flex flex-col items-center gap-4 w-full max-w-sm">
            <input {...getInputProps()} />
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-5">
              <UploadCloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {isDragActive ? "Drop your PDF here" : "Upload a Contract"}
              </h3>
              <p className="text-sm text-muted-foreground">Drag & drop a PDF, or click to browse</p>
            </div>
            <Button className="mt-2">Browse File</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-5 animate-pulse">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-semibold">{selectedFile?.name}</p>
            <p className="text-sm text-muted-foreground">Uploading & starting analysis...</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
