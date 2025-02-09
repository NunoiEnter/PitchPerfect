export function Card({ children, className }) {
    return (
      <div className={`bg-gray-800 p-6 rounded-lg shadow-md ${className}`}>
        {children}
      </div>
    );
  }
  
  