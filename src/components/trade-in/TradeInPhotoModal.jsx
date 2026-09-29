'use client';

export default function TradeInPhotoModal({ previewImageModal, setPreviewImageModal }) {
  if (!previewImageModal) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in cursor-pointer"
      onClick={() => setPreviewImageModal(null)}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-3 shadow-2xl flex flex-col items-center justify-center animate-scale-in cursor-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setPreviewImageModal(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all border border-white/10 shadow-lg text-sm font-bold"
          title="Tutup Foto"
        >
          ✕
        </button>
        <img
          src={previewImageModal}
          alt="Foto Perangkat"
          className="max-w-full max-h-[82vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
