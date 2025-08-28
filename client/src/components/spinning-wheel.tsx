import { useState } from "react";

interface SpinningWheelProps {
  id: string;
  title: string;
  options: string[];
  currentSelection: string;
  onSelectionChange: (selection: string) => void;
}

export default function SpinningWheel({ 
  id, 
  title, 
  options, 
  currentSelection, 
  onSelectionChange 
}: SpinningWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * options.length);
      const newSelection = options[randomIndex];
      onSelectionChange(newSelection);
      setIsSpinning(false);
    }, 2000);
  };

  return (
    <div className="text-center" data-testid={`spinning-wheel-${id}`}>
      <h3 className="text-2xl font-semibold mb-6" data-testid={`heading-${id}`}>{title}</h3>
      <div className="relative w-64 h-64 mx-auto mb-6">
        <div 
          className={`spinning-wheel w-full h-full border-8 border-primary rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/80 transition-colors ${isSpinning ? 'wheel-spinning' : ''}`}
          onClick={spinWheel}
          data-testid={`wheel-${id}`}
        >
          <div className="text-center">
            <div className="text-lg font-semibold" data-testid={`result-${id}`}>
              {currentSelection}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm" data-testid={`options-${id}`}>
        {options.map((option, index) => (
          <div key={index} className="bg-card p-2 rounded border" data-testid={`option-${id}-${index}`}>
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}
