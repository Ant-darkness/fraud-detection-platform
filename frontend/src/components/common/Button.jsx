export default function Button({ 
    children, 
    onClick, 
    type = "button", 
    loading = false, 
    variant = "primary", 
    className = "" 
  }) {
    const baseStyle = "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 shadow-xs focus:outline-none flex items-center justify-center";
    
    const variants = {
      primary: "bg-[#C5A059] text-white hover:bg-[#A4813D] disabled:opacity-50",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
      danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
    };
  
    return (
      <button
        type={type}
        disabled={loading}
        onClick={onClick}
        className={`${baseStyle} ${variants[variant]} ${className}`}
      >
        {loading ? "Processing Node..." : children}
      </button>
    );
  }
  