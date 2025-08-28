import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Home, Download, BookOpen } from "lucide-react";
import { marked } from "marked";

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface BookData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  chapters: Chapter[];
  selectedTemplate: string;
  coverImageUrl?: string;
  language: string;
}

export default function FlipbookPreview() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flipbookRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get book data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookDataParam = urlParams.get('bookData');
    
    if (bookDataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(bookDataParam));
        setBookData(parsedData);
      } catch (error) {
        console.error('Error parsing book data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-purple-600 mx-auto animate-pulse mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading flipbook preview...</p>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Book Data Found</h2>
            <p className="text-gray-600 mb-4">Unable to load book data for preview.</p>
            <Button onClick={() => setLocation('/create-book')}>
              <Home className="w-4 h-4 mr-2" />
              Return to Create Book
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate pages for flipbook
  const generatePages = () => {
    const pages = [];
    
    // Cover page
    pages.push(
      <div key="cover" className="flip-page h-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-purple-100 to-blue-100">
        {bookData.coverImageUrl ? (
          <img
            src={bookData.coverImageUrl}
            alt="Book Cover"
            className="w-48 h-64 object-cover rounded-lg shadow-lg mb-6"
          />
        ) : (
          <div className="w-48 h-64 bg-gray-200 rounded-lg shadow-lg mb-6 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-center mb-2">{bookData.title}</h1>
        {bookData.subtitle && (
          <h2 className="text-lg text-gray-600 text-center mb-4">{bookData.subtitle}</h2>
        )}
        <p className="text-center text-gray-700 font-medium">by {bookData.author}</p>
      </div>
    );

    // Description page
    pages.push(
      <div key="description" className="flip-page h-full flex flex-col justify-center p-8">
        <h2 className="text-xl font-semibold mb-4 text-center">About This Book</h2>
        <p className="text-gray-700 leading-relaxed text-center max-w-md mx-auto">
          {bookData.description}
        </p>
      </div>
    );

    // Table of contents
    pages.push(
      <div key="toc" className="flip-page h-full p-8">
        <h2 className="text-xl font-semibold mb-6 text-center">Table of Contents</h2>
        <div className="space-y-3">
          {bookData.chapters.map((chapter, index) => (
            <div key={chapter.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <span className="font-medium">Chapter {index + 1}: {chapter.title}</span>
              <span className="text-gray-500">Page {4 + index * 2}</span>
            </div>
          ))}
        </div>
      </div>
    );

    // Chapter pages
    bookData.chapters.forEach((chapter, index) => {
      // Chapter title page
      pages.push(
        <div key={`chapter-title-${index}`} className="flip-page h-full flex flex-col justify-center items-center p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Chapter {index + 1}</h1>
            <h2 className="text-xl text-gray-600">{chapter.title}</h2>
          </div>
        </div>
      );

      // Chapter content page
      pages.push(
        <div key={`chapter-content-${index}`} className="flip-page h-full p-8 overflow-y-auto">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(chapter.content) }}
          />
        </div>
      );
    });

    return pages;
  };

  const pages = generatePages();
  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error?.message || error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/create-book')}
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Back to Editor</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <h1 className="text-lg font-semibold">{bookData.title} - Flipbook Preview</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('epub')}
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                EPUB
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Flipbook Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          {/* Flipbook */}
          <div 
            ref={flipbookRef}
            className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: '600px',
              height: '800px',
              perspective: '1000px'
            }}
          >
            {/* Current Page */}
            <div className="absolute inset-0 transition-transform duration-500 ease-in-out transform-style-preserve-3d">
              {pages[currentPage]}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Page Navigation Dots */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPage ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page Turn Animation Styles */}
      <style>{`
        .flip-page {
          transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
        }
        
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}