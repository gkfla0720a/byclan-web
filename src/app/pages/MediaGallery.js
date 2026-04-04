function MediaGallery() {
  const mediaItems = [
    { id: 1, type: '영상', title: 'BSL 시즌4 결승전 하이라이트', date: '2025.12.20', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
    { id: 2, type: '사진', title: '2025년 바이클랜 연말 모임', date: '2025.12.15', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop' },
  ];
  
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">🎬 미디어 갤러리</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            <img src={item.img} className="w-full aspect-video object-cover opacity-70" alt="" />
            <div className="p-4">
              <h3 className="text-white font-bold truncate">{item.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaGallery;
