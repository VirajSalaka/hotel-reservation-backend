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
      const result = await client.query(
        `WITH room_type_id AS (
          SELECT id
          FROM room_type
          WHERE name = $1
      )
      SELECT r.number
      FROM room r
      CROSS JOIN room_type_id
      WHERE r.type = room_type_id.id
      AND r.number NOT IN (
          SELECT res.room
          FROM reservation res
          WHERE (
              $2 < res.checkout_date
              AND $3 > res.checkin_date
          )
      );
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
        `INSERT INTO reservation ("id", "room", "checkin_date", "checkout_date", "user", "user_info", "created_at", "updated_at")
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
        json_build_object(
            'id', res.id,
            'room', json_build_object(
                'number', r.number,
                'type', json_build_object(
                    'number', r.number,
                    'name', rt.name,
                    'guestCapacity', rt.guest_capacity,
                    'price', rt.price
                )
            ),
            'user', res.user_info::json,
            'checkinDate', res.checkin_date,
            'checkoutDate', res.checkout_date
        ) AS reservation
    FROM 
        reservation res
    JOIN 
        room r ON res.room = r.number
    JOIN 
        room_type rt ON r.type = rt.id
    WHERE 
        res.user = $1;
    
    `,
        [userId]
      );
      return result.rows;
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
        json_build_object(
            'id', res.id,
            'room', json_build_object(
                'number', r.number,
                'type', json_build_object(
                    'number', r.number,
                    'name', rt.name,
                    'guestCapacity', rt.guest_capacity,
                    'price', rt.price
                )
            ),
            'user', res.user_info::json,
            'checkinDate', res.checkin_date,
            'checkoutDate', res.checkout_date
        ) AS reservation
    FROM 
        reservation res
    JOIN 
        room r ON res.room = r.number
    JOIN 
        room_type rt ON r.type = rt.id
    WHERE 
        res.id = $1;
      `,
        [reservationId]
      );
      if (result.rowCount == 0) {
        return null;
      }
      return result.rows[0];
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
