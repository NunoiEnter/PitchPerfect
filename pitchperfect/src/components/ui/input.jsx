import PropTypes from "prop-types";

export function Input({ type, onChange, className }) {
  return (
    <input
      type={type}
      onChange={onChange}
      className={`w-full p-2 border rounded-md bg-gray-900 text-white ${className}`}
    />
  );
}

// Add prop validation
Input.propTypes = {
  type: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
