export const getAvatarColor = (name) => {
  if (!name) return '#00C853'; // default green
  const charCode = name.charCodeAt(0) || 0;
  
  // A palette of nice, modern UI colors
  const colors = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#F44336', // Red
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#FF5722'  // Deep Orange
  ];
  
  return colors[charCode % colors.length];
};
