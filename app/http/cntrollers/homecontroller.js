const RoomType = require("../../models/RoomType"); // Model import (Sequelize)

function homecontroller() {
  return {
    async index(req, res) {
      try {
        // Room types fetch karo database se
        const roomTypes = await RoomType.findAll();

        // Parse images safely
        roomTypes.forEach((room) => {
          try {
            const parsedImages = JSON.parse(room.images);
            room.images = Array.isArray(parsedImages) ? parsedImages : [];
          } catch (err) {
            console.error("Image parse error:", err);
            room.images = [];
          }
        });

        // Render home page with room types
        res.render("hoome", { roomTypes });

      } catch (err) {
        console.error("Error fetching room types:", err);
        res.render("hoome", { roomTypes: [] });
      }
    },
  };
}

module.exports = homecontroller;