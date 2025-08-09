import { useRef, useState } from "react";
import MobileLayout from "@/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Step1Camera() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const next = () => {
    if (!preview) return;
    navigate("/snap/cafe", { state: { image: preview } });
  };

  return (
    <MobileLayout title="Snap a Coffee">
      <section className="p-4">
        <h1 className="sr-only">Take Photo</h1>
        <div className="rounded-2xl overflow-hidden border bg-black aspect-[9/16] flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Coffee preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-white/80">
              <p className="mb-3">Open your camera or select from gallery</p>
              <Button onClick={() => inputRef.current?.click()} variant="secondary" className="rounded-full">Open Gallery</Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => inputRef.current?.click()} variant="secondary" className="rounded-full flex-1">{preview ? 'Retake' : 'Choose Photo'}</Button>
          <Button onClick={next} disabled={!preview} className="rounded-full flex-1">Next</Button>
        </div>
      </section>
    </MobileLayout>
  );
}
