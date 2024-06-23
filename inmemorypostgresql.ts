import { newDb } from "pg-mem";

const db = newDb();
db.public.none(`
  CREATE TABLE "room"(
    "number" INT NOT NULL,
    "type" INT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "room_number_index" ON
    "room"("number");
ALTER TABLE
    "room" ADD CONSTRAINT "room_number_primary" PRIMARY KEY("number");
CREATE TABLE "room_type"(
    "id" INT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guest_capacity" INT NOT NULL,
    "price" INT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "room_type_name_index" ON
    "room_type"("name");
ALTER TABLE
    "room_type" ADD CONSTRAINT "room_type_id_primary" PRIMARY KEY("id");
CREATE TABLE "reservation"(
    "id" UUID NOT NULL,
    "room" INT NOT NULL,
    "checkin_date" DATE NOT NULL,
    "checkout_date" DATE NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "user_info" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "reservation_id_index" ON
    "reservation"("id");
CREATE INDEX "reservation_checkin_date_checkout_date_index" ON
    "reservation"("checkin_date", "checkout_date");
ALTER TABLE
    "reservation" ADD CONSTRAINT "reservation_id_primary" PRIMARY KEY("id");
CREATE TABLE "user"(
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "contact_number" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "user" ADD CONSTRAINT "user_id_primary" PRIMARY KEY("id");
ALTER TABLE
    "room" ADD CONSTRAINT "room_type_foreign" FOREIGN KEY("type") REFERENCES "room_type"("id");
ALTER TABLE
    "reservation" ADD CONSTRAINT "reservation_id_foreign" FOREIGN KEY("room") REFERENCES "room"("number");`);

db.public.none(` INSERT INTO room_type (id, name, guest_capacity, price) VALUES (1,'Single', 1, 80);
 INSERT INTO room_type (id, name, guest_capacity, price) VALUES (2, 'Double', 2, 120);
 INSERT INTO room_type (id, name, guest_capacity, price) VALUES (3, 'Family', 4, 200);
 INSERT INTO room_type (id, name, guest_capacity, price) VALUES (4, 'Suite', 4, 300);


INSERT INTO room (number, type) VALUES (101, 1);
INSERT INTO room (number, type) VALUES (102, 1);
INSERT INTO room (number, type) VALUES (103, 1);
INSERT INTO room (number, type) VALUES (104, 1);
INSERT INTO room (number, type) VALUES (105, 2);
INSERT INTO room (number, type) VALUES (106, 2);
INSERT INTO room (number, type) VALUES (201, 1);
INSERT INTO room (number, type) VALUES (202, 1);
INSERT INTO room (number, type) VALUES (203, 1);
INSERT INTO room (number, type) VALUES (204, 2);
INSERT INTO room (number, type) VALUES (205, 2);
INSERT INTO room (number, type) VALUES (206, 2);
INSERT INTO room (number, type) VALUES (301, 2);
INSERT INTO room (number, type) VALUES (302, 2);
INSERT INTO room (number, type) VALUES (303, 3);
INSERT INTO room (number, type) VALUES (304, 4);
INSERT INTO room (number, type) VALUES (305, 1);
INSERT INTO room (number, type) VALUES (306, 2);
INSERT INTO room (number, type) VALUES (401, 1);
INSERT INTO room (number, type) VALUES (402, 2);
INSERT INTO room (number, type) VALUES (403, 3);
INSERT INTO room (number, type) VALUES (404, 4);
INSERT INTO room (number, type) VALUES (405, 1);
INSERT INTO room (number, type) VALUES (406, 4);`);    

const {Client} = db.adapters.createPg();
// Function to acquire a client from the pool
export async function getClient(): Promise<typeof Client> {
    const client = new Client()
    return await client.connect()  
  }

// Export the pool for direct query execution if needed
export default db;
