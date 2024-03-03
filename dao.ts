import { getClient } from "./postgresql";

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
    client.release();
  }
}

export async function getAvailableRoomTypes(
  checkInDate: string,
  checkOutDate: string,
  guestCapacity: number
) {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT rt.id, rt.name, rt.guest_capacity, rt.price
    FROM room_type rt
    WHERE rt.guest_capacity >= $1
    AND rt.id NOT IN (
        SELECT r.type
        FROM room r
        JOIN reservation res ON r.number = res.room
        WHERE (
            $2 <= res.checkout_date
            AND $3 >= res.checkin_date
        )
    )
    `,
      [guestCapacity, checkInDate, checkOutDate]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

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
    client.release();
  }
}

export async function createReservation(reservation: Reservation) {
  const client = await getClient();
  const { id, room, checkinDate, checkoutDate, user } = reservation;
  try {
    const result = await client.query(
      `INSERT INTO reservation ("id", "room", "checkin_date", "checkout_date", "user", "created_at", "updated_at")
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `,
      [id, room, checkinDate, checkoutDate, user.id]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

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
          'checkinDate', res.checkin_date,
          'checkoutDate', res.checkout_date
      )
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
    client.release();
  }
}

export async function getReservation(
  reservationId: string
): Promise<Reservation | null> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT *
      FROM reservation
      WHERE "id" = $1;
      
    `,
      [reservationId]
    );
    if (result.rowCount == 0) {
      return null;
    }
    return result.rows[0];
  } finally {
    client.release();
  }
}

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
    client.release();
  }
}
