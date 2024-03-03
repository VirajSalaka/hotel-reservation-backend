import express, { Express, Request, Response, Router } from "express";
import { getAllRooms, getAvailableRoom } from "./util";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import {
  createReservation,
  getAvailableRoomTypes,
  getAvailableRooms,
  getReservation,
  getReservations,
  updateReservation,
} from "./dao";

const app: Express = express();
const router: Router = express.Router();
const port = 4000;

app.use(cors());
app.use(express.json());

export const rooms: Room[] = getAllRooms();
export const roomReservations: { [id: string]: Reservation } = {};

// POST /reservations
router.post(
  "/",
  async (
    req: Request<NewReservationRequest>,
    res: Response<Reservation | NewReservationError>
  ) => {
    const payload = req.body;
    console.log("Request received by POST /reservations", payload);
    // Check if room is available for the given dates
    const availableRooms = await getAvailableRooms(
      payload.checkinDate,
      payload.checkoutDate,
      payload.roomType
    );
    if (availableRooms.length == 0) {
      return res.status(400).send({
        http: "NotFound",
        body: "No rooms available for the given dates and type",
      });
    }

    // Create a new reservation
    const reservation = {
      id: uuidv4(),
      user: payload.user,
      room: availableRooms[0].number,
      checkinDate: payload.checkinDate,
      checkoutDate: payload.checkoutDate,
    };

    await createReservation(reservation);
    // Add reservation to the map
    //roomReservations[reservation.id] = reservation;

    res.json(reservation);
  }
);

router.get("/roomTypes", async (req: Request, res) => {
  console.log("Request received by GET /reservations/roomTypes", req.query);
  const { checkinDate, checkoutDate, guestCapacity } = req.query;

  // Validate query parameters
  if (!checkinDate || !checkoutDate || !guestCapacity) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Call the function to get available room types
  try {
    // const roomTypes = getAvailableRoomTypes(
    //   checkinDate.toString(),
    //   checkoutDate.toString(),
    //   parseInt(guestCapacity.toString(), 10)
    // );
    const roomTypes = await getAvailableRoomTypes(
      checkinDate.toString(),
      checkoutDate.toString(),
      parseInt(guestCapacity.toString(), 10)
    );
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/users/:userId",
  async (req: Request, res: Response<Reservation[]>) => {
    const userId = req.params.userId;
    const reservations = await getReservations(userId);
    const resp = reservations.map(
      (reservation) => reservation.json_build_object
    );
    return res.json(resp);
  }
);

router.put(
  "/:reservationId",
  async (
    req: Request,
    res: Response<Reservation | UpdateReservationError | null>
  ) => {
    const reservationId = req.params.reservationId;
    const { checkinDate, checkoutDate }: UpdateReservationRequest = req.body;
    // if (!roomReservations[reservationId]) {
    //   res.json({ http: "NotFound", body: "Reservation not found" });
    // }
    const reservation = await getReservation(reservationId);
    if (reservation == null) {
      res.json({ http: "NotFound", body: "Reservation not found" });
    } else {
      const rooms = await getAvailableRooms(
        checkinDate,
        checkoutDate,
        reservation.room.type.name
      );
      if (rooms.length == 0) {
        res.json({ http: "NotFound", body: "No rooms available" });
      }
      const updatedReservation = await updateReservation(
        reservation.id,
        checkinDate,
        checkoutDate
      );
      // roomReservations[reservationId].checkinDate = checkinDate;
      // roomReservations[reservationId].checkoutDate = checkoutDate;
      res.json(updatedReservation);
    }
  }
);

router.delete("/:reservationId", (req: Request, res: Response) => {
  const reservationId = req.params.reservationId;
  if (!roomReservations[reservationId]) {
    res.json({ http: "NotFound", body: "Reservation not found" });
  }
  delete roomReservations[reservationId];
  res.sendStatus(200);
});

app.use("/api/reservations", router);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
