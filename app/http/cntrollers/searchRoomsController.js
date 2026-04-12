const { Op } = require("sequelize");
const RoomType = require("../../models/RoomType");
const Booking = require("../../models/Booking");

function searchRoomsController() {
  return {
    async searchRooms(req, res) {
      try {
        const { checkin, checkout, roomType, guests } = req.body;

        if (!checkin || !checkout) {
          return res.status(400).json({ message: "Please select both check-in and check-out dates." });
        }

        const checkInDate = new Date(checkin);
        const checkOutDate = new Date(checkout);

        let where = {};
        if (roomType) where.id = roomType;
        if (guests) where.capacity = { [Op.gte]: guests };

        const rooms = await RoomType.findAll({ where });

        const formatted = await Promise.all(rooms.map(async r => {
          // Count confirmed bookings overlapping with requested dates
          const bookedQty = await Booking.count({
            where: {
              roomTypeId: r.id,
              status: 'confirmed',
              checkInDate: { [Op.lt]: checkOutDate },
              checkOutDate: { [Op.gt]: checkInDate }
            }
          });

          const available = (r.quantity || 10) - (bookedQty || 0); // fallback to 10 if not set

          return {
            id: r.id,
            name: r.name,
            pricePerNight: r.pricePerNight,
            description: r.description,
            capacity: r.capacity,
            available,
            images: r.images
          };
        }));

        res.json(formatted);

      } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Error searching rooms" });
      }
    }
  };
}

module.exports = searchRoomsController;