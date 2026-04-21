export const compressImage = (file, callback) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; // Optimal max dimension for standard hub 
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // Adding soft smooth render
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Outputs to local storage friendly WebP Base64 string at 70% quality (Approx 15kb - 25kb)
      callback(canvas.toDataURL('image/webp', 0.7)); 
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
