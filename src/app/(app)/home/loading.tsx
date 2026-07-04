import React from 'react';

export default function HomeLoading() {
  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 md:p-12 animate-pulse">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Header Skeleton */}
        <div className="flex justify-between items-center w-full">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded-full mb-2"></div>
            <div className="h-4 w-24 bg-gray-100 rounded-full"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded-2xl"></div>
        </div>

        {/* Date Selector Skeleton */}
        <div className="h-[88px] w-full bg-gray-100 rounded-[2rem] border-4 border-gray-200 flex items-center justify-between p-2">
           <div className="h-14 w-14 bg-gray-200 rounded-[1.5rem]"></div>
           <div className="flex gap-2 opacity-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-12 bg-gray-200 rounded-2xl"></div>
              ))}
           </div>
           <div className="h-14 w-14 bg-gray-200 rounded-[1.5rem]"></div>
        </div>

        {/* Routine Viewer Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 bg-gray-200 rounded-full"></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-gray-100 h-[50vh] min-h-[400px] flex flex-col gap-4 overflow-hidden relative">
            
            {/* Grid Lines */}
            <div className="absolute left-16 top-0 bottom-0 border-r-2 border-gray-100"></div>
            <div className="absolute left-16 right-0 top-12 border-t-2 border-gray-100"></div>
            <div className="absolute left-16 right-0 top-32 border-t-2 border-gray-100"></div>
            <div className="absolute left-16 right-0 top-52 border-t-2 border-gray-100"></div>

            {/* Block Skeletons */}
            <div className="h-20 w-full bg-gray-100 rounded-2xl ml-12 relative z-10 border-2 border-gray-200">
              <div className="absolute top-4 left-4 h-4 w-1/3 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-28 w-full bg-blue-50 rounded-2xl ml-12 relative z-10 border-2 border-blue-100 mt-2">
              <div className="absolute top-4 left-4 h-4 w-1/2 bg-blue-200 rounded-full"></div>
            </div>
            <div className="h-16 w-full bg-pink-50 rounded-2xl ml-12 relative z-10 border-2 border-pink-100 mt-4">
               <div className="absolute top-4 left-4 h-4 w-1/4 bg-pink-200 rounded-full"></div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
