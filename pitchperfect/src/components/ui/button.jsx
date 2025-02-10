import PropTypes from "prop-types";

export function Button({ children, onClick, className }) {
  return (
    <button
      className={`px-4 py-2 bg-white-600 hover:bg-white-700 text-white rounded-md ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Add prop validation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
