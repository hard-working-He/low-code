import React, { useRef } from 'react';
import './index.scss';

interface LTextProps {
  propValue: string;
  element: any; // You might want to define a more specific type
  onInput: (element: any, value: string) => void;
  editMode?: 'edit' | 'preview'; // Add editMode as a prop with default in preview mode
}

const LText: React.FC<LTextProps> = ({ propValue, element, onInput, editMode = 'edit' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    //console.log(e.target.value);
    onInput(element, e.target.value);
  };

  return (
    <>
    <div className='l-text-container'>
      {editMode === 'edit' ? (
        <textarea
          value={propValue}
          className="text textarea"
          onChange={handleInput}
          ref={textareaRef}
        />
      ) : (
        <div className="text disabled">
          {propValue.split('\n').map((text, index) => (
            <div key={index}>{text}</div>
          ))}
        </div>
      )}
    </div>
      
    </>
  );
};

export default LText;
