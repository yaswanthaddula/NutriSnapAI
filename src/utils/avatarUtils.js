export const getAvatarColor = (name) => {
  if (!name) return '#4CAF50';
  const charCode = name.charCodeAt(0) || 0;
  
  // A palette of rich, modern UI colors suitable for white text
  const colors = [
    '#E53935', // Red
    '#D81B60', // Pink
    '#8E24AA', // Purple
    '#5E35B1', // Deep Purple
    '#3949AB', // Indigo
    '#1E88E5', // Blue
    '#039BE5', // Light Blue
    '#00ACC1', // Cyan
    '#00897B', // Teal
    '#43A047', // Green
    '#7CB342', // Light Green
    '#F4511E', // Deep Orange
    '#6D4C41', // Brown
    '#546E7A', // Blue Grey
  ];
  
  return colors[charCode % colors.length];
};
