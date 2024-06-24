import { getClient } from "./inmemorypostgresql";

/**
 * getAllRooms returns all the rooms
 * @returns Promise<Room[]>
 */
export async function getAllRooms(): Promise<Room[]> {
    const client = await getClient();
    try {
      const result = await client.query(`SELECT 
          r.number,
          jsonb_build_object(
              'id', rt.id,
              'name', rt.name,
              'guestCapacity', rt.guest_capacity,
              'price', rt.price
          ) AS type
      FROM 
          room r
      JOIN 
          room_type rt ON r.type = rt.id;`);
      return result.rows;
    } finally {
        client.end();
    }
  }
  
  /**
   * getAvailableRoomTypes returns available room
   * types for a given date range for a given guest capacity.
   *
   * @param checkInDate - CheckIn Date
   * @param checkOutDate - CheckOut Date
   * @param guestCapacity - Guest capacity
   * @returns
   */
  export async function getAvailableRoomTypes(
    checkInDate: string,
    checkOutDate: string,
    guestCapacity: number
  ) {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT room_type.id, room_type.name, room_type.guest_capacity, room_type.price
        FROM room_type
        WHERE room_type.guest_capacity >= $1
        AND room_type.id IN (
            SELECT room.type
            FROM room
            WHERE room.number NOT IN (
                SELECT reservation.room
                FROM reservation
                WHERE $2 <= reservation.checkout_date
                AND $3 >= reservation.checkin_date
            )
        );      
      `,
        [guestCapacity, checkInDate, checkOutDate]
      );
      return result.rows;
    } finally {
        client.end();
    }
  }
  
  /**
   * getAvailableRooms returns a list of available
   * rooms for a given data range and for a given room type.
   *
   * @param checkInDate - CheckIn Date
   * @param checkOutDate - CheckOut Date
   * @param roomType - Type of the room
   * @returns
   */
  export async function getAvailableRooms(
    checkInDate: string,
    checkOutDate: string,
    roomType: string
  ) {
    const client = await getClient();
    try {
      const result = await client.query( // TODO: (Check this query)
        `SELECT room.number
      FROM room, room_type
      WHERE room.type = room_type.id
      AND room.number NOT IN (
          SELECT reservation.room
          FROM reservation
          WHERE (
              $2 < reservation.checkout_date
              AND $3 > reservation.checkin_date
          )
      ) AND room_type.name = $1;
            `,
        [roomType, checkInDate, checkOutDate]
      );
      return result.rows;
    } finally {
        if (client) {
            client.end();
        }
    }
  }
  
  /**
   * createReservation creates a reservation
   *
   * @param reservation
   * @returns
   */
  export async function createReservation(reservation: Reservation) {
    const client = await getClient();
    const { id, room, checkinDate, checkoutDate, user } = reservation;
    try {
      const result = await client.query(
        `INSERT INTO reservation ("id", "room", "checkin_date", "checkout_date", "user_id", "user_info", "created_at", "updated_at")
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
        [id, room, checkinDate, checkoutDate, user.id, user]
      );
      return result.rows;
    } finally {
        client.end();
    }
  }
  
  /**
   * getReservations returns a list of reservations
   * for a given user.
   *
   * @param userId
   * @returns
   */
  export async function getReservations(userId: string) {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT 
        reservation.id, room.number, room_type.name, room_type.guest_capacity, room_type.price, reservation.user_info, reservation.checkin_date, reservation.checkout_date
    FROM 
        reservation
    JOIN 
        room ON reservation.room = room.number
    JOIN 
        room_type ON room.type = room_type.id
    WHERE 
        reservation.user_id = $1`,
        [userId]
      );
      console.log(result.rows)

    const customJson = result.rows.map((row: { id: any; user_id: any; number: any; name: any; guest_capacity: any; price: any; user_info: any; checkin_date: any; checkout_date: any; }) => {
      return {
        reservation: {
            id: row.id,
        room: {
        number: row.number,
        type: {
          number: row.number,
          name: row.name,
          guestCapacity: row.guest_capacity,
          price: row.price
        }
        },
        user: JSON.parse(row.user_info),
        checkinDate: row.checkin_date,
        checkoutDate: row.checkout_date
        }
      };
    });
    return customJson;
    } finally {
        client.end();
    }
  }
  
  /**
   * getReservation returns the reservation data for a given reservationId.
   *
   * @param reservationId
   * @returns
   */
  export async function getReservation(reservationId: string) {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT 
        reservation.id, room.number, room_type.name, room_type.guest_capacity, room_type.price, reservation.user_info, reservation.checkin_date, reservation.checkout_date
    FROM 
        reservation
    JOIN 
        room ON reservation.room = room.number
    JOIN 
        room_type ON room.type = room_type.id
    WHERE 
        reservation.id = $1;
      `,
        [reservationId]
      );
      if (result.rowCount == 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        reservation: {
            id: row.id,
        room: {
        number: row.number,
        type: {
          number: row.number,
          name: row.name,
          guestCapacity: row.guest_capacity,
          price: row.price
        }
        },
        user: JSON.parse(row.user_info),
        checkinDate: row.checkin_date,
        checkoutDate: row.checkout_date
        }
      };
    } finally {
        client.end();
    }
  }
  
  /**
   * updateReservation updates the reservation.
   *
   * @param reservationId - Reservation ID
   * @param checkInDate - CheckIn date
   * @param checkOutDate- CheckOut date
   * @returns
   */
  export async function updateReservation(
    reservationId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<Reservation | null> {
    const client = await getClient();
    try {
      const result = await client.query(
        `UPDATE reservation
        SET "checkin_date" = $1, "checkout_date" = $2
        WHERE "id" = $3;
        `,
        [checkInDate, checkOutDate, reservationId]
      );
      return result.rows[0];
    } finally {
        client.end();
    }
  }
  
  /**
   * deleteReservation deletes the reservation.
   *
   * @param reservationId - Reservation Id
   * @returns
   */
  export async function deleteReservation(reservationId: string) {
    const client = await getClient();
    try {
      const result = await client.query(
        `DELETE FROM reservation
        WHERE id = $1;
        `,
        [reservationId]
      );
      return result;
    } finally {
        client.end();
    }
  }
