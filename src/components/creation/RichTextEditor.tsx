"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Bold, Italic, Type, Palette, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Underline, Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onOpenMediaLibrary?: () => void;
  onExpand?: () => void;
  isModal?: boolean;
}

export interface RichTextEditorRef {
  insertImage: (url: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
  initialValue, 
  onChange, 
  placeholder,
  onOpenMediaLibrary,
  onExpand,
  isModal 
}, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastRange = useRef<Range | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Only save if the selection is inside our editor
      if (contentRef.current?.contains(range.commonAncestorContainer)) {
        lastRange.current = range;
      }
    }
  };

  const restoreSelection = () => {
    if (lastRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(lastRange.current);
      }
    }
  };

  // Expose insertion method to parent
  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      contentRef.current?.focus();
      restoreSelection();
      document.execCommand('insertImage', false, url);
      // After image insertion, update the stored range to the new position
      saveSelection();
      
      if (contentRef.current) {
        onChange(contentRef.current.innerHTML);
      }
    }
  }));

  const format = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    saveSelection();
    if (contentRef.current) {
        onChange(contentRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    saveSelection();
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== initialValue) {
        if (!isFocused) {
            contentRef.current.innerHTML = initialValue;
        }
    }
  }, [initialValue]);

  return (
    <div className={cn(
        "flex flex-col rounded-xl border border-border bg-white dark:bg-black/40 overflow-hidden transition-all duration-200 shadow-sm",
        isFocused ? "ring-4 ring-primary/5 border-primary/50" : "",
        isModal ? "h-full flex-1" : ""
    )}>
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center p-1.5 bg-black/[0.02] dark:bg-white/[0.02] border-b border-border gap-1">
        <div className="flex items-center gap-0.5 mr-1">
            <ToolbarButton onClick={() => format('bold')} icon={<Bold size={14} />} title="Bold" />
            <ToolbarButton onClick={() => format('italic')} icon={<Italic size={14} />} title="Italic" />
            <ToolbarButton onClick={() => format('underline')} icon={<Underline size={14} />} title="Underline" />
        </div>
        
        <div className="w-px h-4 bg-border/60 mx-1" />
        
        <ToolbarSelect 
            defaultValue="'Plus Jakarta Sans', sans-serif"
            options={[
                { value: "Plus Jakarta Sans, sans-serif", label: 'Default' },
                { value: "Dancing Script, cursive", label: 'Letter' },
                { value: "Playfair Display, serif", label: 'Classic' },
                { value: "Outfit, sans-serif", label: 'Modern' },
                { value: "Space Grotesk, sans-serif", label: 'Artisan' },
                { value: "Cormorant Garamond, serif", label: 'Elegant' },
                { value: "Homemade Apple, cursive", label: 'Cursive' }
            ]}
            onChange={(val) => format('fontName', val)}
        />

        <div className="w-px h-4 bg-border/60 mx-1" />
        
        <button 
           className="relative group size-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
           title="Text Color"
        >
            <Palette size={14} className="text-primary" />
            <input 
                type="color" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => format('foreColor', e.target.value)}
            />
        </button>

        {onOpenMediaLibrary && (
            <ToolbarButton 
                onClick={onOpenMediaLibrary} 
                icon={<ImageIcon size={14} />} 
                title="Insert Image" 
                className="text-primary bg-primary/5 hover:bg-primary/10"
            />
        )}

        <div className="w-px h-4 bg-border/60 mx-1 flex-1 sm:flex-none" />

        <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
            <ToolbarButton onClick={() => format('justifyLeft')} icon={<AlignLeft size={14} />} title="Align Left" />
            <ToolbarButton onClick={() => format('justifyCenter')} icon={<AlignCenter size={14} />} title="Align Center" />
            <ToolbarButton onClick={() => format('justifyRight')} icon={<AlignRight size={14} />} title="Align Right" />
            
            {onExpand && (
               <>
                 <div className="w-px h-4 bg-border/60 mx-1" />
                 <ToolbarButton 
                   onClick={onExpand} 
                   icon={<Maximize2 size={13} />} 
                   title={isModal ? "Exit Fullscreen" : "Full Screen Typing"} 
                   className="text-primary"
                 />
               </>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className={cn(
          "relative overflow-y-auto transition-all duration-300 flex-1",
          isModal ? "p-8 sm:p-12 text-lg" : "min-h-[160px] max-h-[400px] p-5 text-sm"
      )}>
          <div
            ref={contentRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                saveSelection();
                setIsFocused(false);
            }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            className={cn(
                "font-medium outline-none rich-text-container min-h-full pb-32",
                isModal ? "" : ""
            )}
          />
          
          {!initialValue && !isFocused && (
            <div className={cn(
                "absolute text-text-muted/40 pointer-events-none italic",
                isModal ? "top-8 sm:top-12 left-8 sm:left-12 text-lg" : "top-5 left-5 text-sm"
            )}>
              {placeholder || "Write your heartfelt message here..."}
            </div>
          )}
      </div>
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;

function ToolbarButton({ onClick, icon, title, active, className }: any) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "size-8 flex items-center justify-center rounded-md transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-black/5 dark:hover:bg-white/10 text-text-muted",
        className
      )}
      title={title}
    >
      {icon}
    </button>
  );
}

function ToolbarSelect({ options, onChange, defaultValue }: any) {
    return (
        <select 
            defaultValue={defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none border-none py-1.5 px-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
            ))}
        </select>
    );
}
