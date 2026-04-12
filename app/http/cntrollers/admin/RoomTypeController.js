const multer = require("multer");
const path = require("path");
const fs = require("fs");
const RoomType = require("../../../models/RoomType");

// 📸 Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../../../public/img"));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// ✅ Multer upload middleware
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error("Only image files are allowed!"));
    }
}).array("images", 10); // Allow up to 10 images

// 🧩 Controller Functions
function roomTypeController() {
    return {

        // 📜 Fetch all room types
        async list(req, res) {
            try {
                const rooms = await RoomType.findAll();
                rooms.forEach(room => {
                    try {
                        room.images = JSON.parse(room.images || "[]");
                    } catch {
                        room.images = [];
                    }
                });
                res.render("admin/allrooms", { rooms });
            } catch (err) {
                console.error("❌ Error fetching rooms:", err);
                res.status(500).json({ message: "Error fetching rooms" });
            }
        },

        // ➕ Add new room type
        addRoom(req, res) {
            upload(req, res, async (err) => {
                if (err) return res.status(400).json({ message: err.message });

                const { name, capacity, quantity, pricePerNight, description } = req.body;
                const newImages = req.files ? req.files.map(f => `/img/${f.filename}`) : [];

                try {
                    const room = await RoomType.create({
                        name,
                        capacity: parseInt(capacity),
                        quantity: parseInt(quantity),
                        pricePerNight: parseFloat(pricePerNight),
                        description,
                        images: JSON.stringify(newImages)
                    });

                    res.json({ message: "✅ Room type added successfully", room });
                } catch (error) {
                    console.error("❌ Error adding room:", error);
                    res.status(500).json({ message: "Error adding room" });
                }
            });
        },

        // ✏️ Edit room type
        editRoom(req, res) {
            upload(req, res, async (err) => {
                if (err) return res.status(400).json({ message: err.message });

                const { roomId, name, capacity, quantity, pricePerNight, description } = req.body;
                const newImages = req.files ? req.files.map(f => `/img/${f.filename}`) : [];

                try {
                    const room = await RoomType.findByPk(roomId);
                    if (!room) return res.status(404).json({ message: "Room not found" });

                    let updatedImages = [];
                    if (room.images) {
                        try {
                            updatedImages = JSON.parse(room.images);
                        } catch {
                            updatedImages = [];
                        }
                    }

                    // If new images uploaded, replace old ones
                    if (newImages.length > 0) {
                        // Delete old images from filesystem
                        updatedImages.forEach(img => {
                            const imgPath = path.join(__dirname, "../../../../public", img);
                            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });
                        updatedImages = newImages;
                    }

                    await room.update({
                        name,
                        capacity: parseInt(capacity),
                        quantity: parseInt(quantity),
                        pricePerNight: parseFloat(pricePerNight),
                        description,
                        images: JSON.stringify(updatedImages)
                    });

                    res.json({ message: "✅ Room type updated successfully", room });
                } catch (error) {
                    console.error("❌ Error updating room:", error);
                    res.status(500).json({ message: "Error updating room" });
                }
            });
        },

        // ❌ Delete room type
        async deleteRoom(req, res) {
            const { roomId } = req.body;
            try {
                const room = await RoomType.findByPk(roomId);
                if (!room) return res.status(404).json({ message: "Room not found" });

                // Delete linked images
                let imagePaths = [];
                try {
                    imagePaths = JSON.parse(room.images || "[]");
                } catch {
                    imagePaths = [];
                }

                imagePaths.forEach(img => {
                    const imgPath = path.join(__dirname, "../../../../public", img);
                    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                });

                await room.destroy();
                res.json({ message: "✅ Room deleted successfully" });
            } catch (error) {
                console.error("❌ Error deleting room:", error);
                res.status(500).json({ message: "Error deleting room" });
            }
        },
    indexApi() {
  return async (req, res) => {
    try {
      const rooms = await RoomType.findAll();

      // images parse kar (IMPORTANT)
      const formatted = rooms.map(room => {
        let images = [];
        try {
          images = JSON.parse(room.images || "[]");
        } catch {
          images = [];
        }

        return {
          ...room.dataValues,
          images
        };
      });

      res.json(formatted);

    } catch (err) {
      console.error("Room Types Error:", err);
      res.status(500).json({ error: "Database error" });
    }
  };
}
    };
}

module.exports = roomTypeController;