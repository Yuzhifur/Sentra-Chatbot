import React from 'react';
import './component.css';

type ComponentProps = {
  resetComponent: () => void; // Function to reset component to default content
};

const Component: React.FC<ComponentProps> = ({ resetComponent }) => {
  return (
    <div className="component">
      {/* Example element that resets component on click */}
      <div className="header">
        <h2
          onClick={resetComponent}
        >
          Sentra
        </h2>
      </div>
      {/* Add elements here */}
    </div>
  );
};

export default Component;